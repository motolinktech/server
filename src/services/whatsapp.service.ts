import { dayjs } from "../utils/dayjs";

const WHATSAPP_WEBHOOK_URL =
  "https://n8n-lk0sscsw44ok4ow8o0kk0o48.72.60.49.4.sslip.io/webhook/send-messages";

interface SendMessageParams {
  name: string;
  phone: string;
  message: string;
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
}

interface UserInviteParams {
  user: { name: string; phone: string };
  passwordSetupLink: string;
}

export function whatsappService() {
  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return phone;
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const sendMessage = async (params: SendMessageParams): Promise<boolean> => {
    const phoneWithPrefix = normalizePhone(params.phone);

    const requestBody = {
      messages: [
        {
          nome: params.name,
          telefone: phoneWithPrefix,
          mensagem: params.message,
        },
      ],
    };

    console.log("[whatsappService] Sending message to:", phoneWithPrefix);
    console.log(
      "[whatsappService] Request body:",
      JSON.stringify(requestBody, null, 2),
    );

    try {
      const response = await fetch(WHATSAPP_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "motolink-api-token": process.env.WHATSAPP_TOKEN || "",
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
    const { deliveryman, slot, client, confirmationUrl } = params;

    const clientAddress = `${client.street}, ${client.number} - ${client.neighborhood}`;
    const shiftPeriod = `${dayjs(slot.startTime).tz().format("HH:mm")} às ${dayjs(slot.endTime).tz().format("HH:mm")}`;

    const message = `👋🏻 Olá, ${deliveryman.name}, você foi convocado para uma escala de prestação de serviço na modalidade entrega no dia *${dayjs(slot.shiftDate).tz().format("DD/MM/YYYY")}*.  Gostaria de participar?\n
📄 Informações da Escala:\n
Data: ${dayjs(slot.shiftDate).tz().format("DD/MM/YYYY")}
Cliente: ${client.name}
Motoboy: ${deliveryman.name}
Endereço: ${clientAddress}
Escala: ${shiftPeriod}
\n
Caso tenha interesse, você poderá aceitar ou recusar livremente por meio do link abaixo:\n
👉 ${confirmationUrl}`;

    return sendMessage({
      name: deliveryman.name,
      phone: deliveryman.phone,
      message,
    });
  };

  const sendUsersInvite = async (
    params: UserInviteParams,
  ): Promise<boolean> => {
    const { user, passwordSetupLink } = params;

    const message = `Olá, ${user.name}!\nSua conta foi criada. Para configurar sua senha, acesse o link abaixo:\n${passwordSetupLink}\nEste link expira em 24 horas.`;

    return sendMessage({
      name: user.name,
      phone: user.phone,
      message,
    });
  };

  return { sendWorkShiftInvite, sendUsersInvite };
}
