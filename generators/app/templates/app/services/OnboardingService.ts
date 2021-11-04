/*
  OnboardingService
    Manages new account creation
*/

import { AuthType, User } from "@/models/User";
import { Role } from "@/models/Role";

class OnboardingService {
  async createUser(
    name: string,
    email: string,
    password: string,
    authType: AuthType = AuthType.Email,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const newUser: Partial<User> = {
      name,
      email,
      password,
      authType,
      firstName,
      lastName,
    };

    if (authType !== AuthType.Email) {
      // Mark as active
      newUser.isActive = true;
      // for Ms and Google, we don't use the password field
      newUser.password = "dummypassword";
    }

    const user: User = await User.create(newUser);
    const adminRole = await Role.findOne({
      where: { name: "Admin" },
    });
    await user.addRole(adminRole.id);
    return user;
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;
