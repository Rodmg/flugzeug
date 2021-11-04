import { User } from "@/models/User";
import { Policy } from "@/models/Policy";
import { Role } from "@/models/Role";

export async function seed(): Promise<void> {
  // Do your seed code here.

  // Creates first admin user
  const count = await User.count();
  if (count === 0) {
    const adminRole = await Role.create({
      name: "Admin",
      description: "Has access to everything",
      isDefault: true,
    });

    const adminPolicy = await Policy.create({
      name: "Admin",
      description: "Has access to everything",
      isSystemManaged: true,
      permission: {
        "user.*.*": true,
        "profile.*.*": true,
        "role.*.r": true,
      },
    });
    await adminRole.addPolicy(adminPolicy.id);

    const user = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "adminadmin",
      active: true,
      role: "admin",
    });
    await user.addRole(adminRole.id);
  }
}
