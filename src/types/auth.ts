import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "STAFF" | "ACCOUNTANT";
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "STAFF" | "ACCOUNTANT";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "OWNER" | "STAFF" | "ACCOUNTANT";
  }
}
