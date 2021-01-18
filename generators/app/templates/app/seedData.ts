import { User } from "@/models/User";

export async function seed(): Promise<void> {
  // Do your seed code here.

  // Creates first admin user
  const count = await User.count();
  if (count === 0) {
    await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "adminadmin",
      role: "admin",
    });
  }
}
