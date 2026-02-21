import { dayjs } from "../utils/dayjs";
import { db } from "./database.service";

interface SendMessageParams {
  phone: string;
  message: string;
  branchId: string;
}

interface WorkShiftInviteParams {
  deliveryman: { name: string; phone: string };
  slot: { shiftDate: Date; startTime: Date; endTime: Date };
  client: {
    name: string;
    street: string;
    number: string;
    neighborhood: string;
  };
  confirmationUrl: string;
  branchId: string;
}

interface UserInviteParams {
  user: { name: string; phone: string };
  passwordSetupLink: string;
  branchId: string;
}

export function whatsappService() {
  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return phone;
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const sendMessage = async (params: SendMessageParams): Promise<boolean> => {
    const branch = await db.branch.findUnique({
      where: { id: params.branchId },
      select: { whatsappUrl: true, whatsappApiKey: true },
    });

    if (!branch) {
      console.error("[whatsappService] Branch not found:", params.branchId);
      return false;
    }

    if (!branch.whatsappUrl) {
      console.warn(
        "[whatsappService] Branch has no whatsappUrl configured:",
        params.branchId,
      );
      return false;
    }

    const phoneWithPrefix = normalizePhone(params.phone);

    const requestBody = {
      chatId: `${phoneWithPrefix}@c.us`,
      text: params.message,
      session: "default",
    };

    const url = `${branch.whatsappUrl}/api/sendText`;

    console.log("[whatsappService] Sending message to:", phoneWithPrefix);
    console.log("[whatsappService] Endpoint:", url);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": branch.whatsappApiKey || "",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.text();
      console.log("[whatsappService] Response status:", response.status);
      console.log("[whatsappService] Response body:", responseData);

      if (!response.ok) {
        console.error(
          "[whatsappService] Failed to send message:",
          response.status,
          responseData,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("[whatsappService] Error sending message:", error);
      return false;
    }
  };

  const sendWorkShiftInvite = async (
    params: WorkShiftInviteParams,
  ): Promise<boolean> => {
    const { deliveryman, slot, client, confirmationUrl, branchId } = params;

    const clientAddress = `${client.street}, ${client.number} - ${client.neighborhood}`;
    const shiftPeriod = `${dayjs(slot.startTime).tz().format("HH:mm")} às ${dayjs(slot.endTime).tz().format("HH:mm")}`;

    const message = `👋🏻 Olá, ${deliveryman.name}. Tudo bem? \n
Você está convidado, de forma eventual e facultativa, a manifestar interesse em uma prestação de serviço autônoma, na modalidade entrega, na data abaixo descrita.
A participação não é obrigatória, não gera exclusividade, subordinação, habitualidade ou qualquer tipo de vínculo empregatício, tratando-se de atividade pontual, conforme sua disponibilidade e livre escolha.\n\n
📄 Informações da Prestação de Serviço:
Data: ${dayjs(slot.shiftDate).tz().format("DD/MM/YYYY")}
Cliente: ${client.name}
Prestador: ${deliveryman.name}
Local de apoio: ${clientAddress}
Período estimado: ${shiftPeriod}\n\n
Caso tenha interesse, você poderá aceitar ou recusar livremente por meio do link abaixo:\n\n
👉 ${confirmationUrl}`;

    return sendMessage({
      phone: deliveryman.phone,
      message,
      branchId,
    });
  };

  const sendUsersInvite = async (
    params: UserInviteParams,
  ): Promise<boolean> => {
    const { user, passwordSetupLink, branchId } = params;

    const message = `Olá, ${user.name}!\nSua conta foi criada. Para configurar sua senha, acesse o link abaixo:\n${passwordSetupLink}\nEste link expira em 24 horas.`;

    return sendMessage({
      phone: user.phone,
      message,
      branchId,
    });
  };

  return { sendWorkShiftInvite, sendUsersInvite };
}
