import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient, Prisma } from "@ledgerlens/database";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }

  /**
   * Deterministically resolves the primary organization for a given user.
   * Centralizes the `orderBy: { createdAt: 'asc' }` rule for MVP multi-tenant isolation.
   */
  async getUserPrimaryOrg(userId: string, args?: Omit<Prisma.OrganizationUserFindFirstArgs, 'where'> & { where?: Omit<Prisma.OrganizationUserWhereInput, 'userId'> }) {
    return this.organizationUser.findFirst({
      ...args,
      where: { ...args?.where, userId },
      orderBy: { createdAt: 'asc' }
    });
  }
}