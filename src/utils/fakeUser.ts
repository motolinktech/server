import { statusEnum } from "../shared/enums/status.enum";
import { userRolesEnum } from "../shared/enums/userRoles.enum";

export const fakeUsers = {
  ADMIN: {
    id: "019b9b9b-3028-79c1-a019-64f792309415",
    name: "Admin User",
    email: "admin@mail.com",
    role: userRolesEnum.ADMIN,
    status: statusEnum.ACTIVE,
    isDeleted: false,
    branches: [] as string[],
  },
};
