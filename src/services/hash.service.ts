import { createHmac } from "node:crypto";

export function hashService() {
  const hash = async (text: string): Promise<string> => {
    const textWithPepper = createHmac(
      "sha256",
      process.env.AUTH_SECRET || "secret",
    )
      .update(text)
      .digest("hex");

    return await Bun.password.hash(textWithPepper);
  };

  const compare = async (text: string, hashed: string): Promise<boolean> => {
    try {
      const textWithPepper = createHmac(
        "sha256",
        process.env.AUTH_SECRET || "secret",
      )
        .update(text)
        .digest("hex");

      return await Bun.password.verify(textWithPepper, hashed);
    } catch {
      return false;
    }
  };

  return { hash, compare };
}
