import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async getVendors(userId: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!userOrg) return [];

    const vendors = await this.prisma.vendor.findMany({
      where: { organizationId: userOrg.organizationId },
      orderBy: { name: 'asc' },
    });

    return vendors.map(v => ({
      id: v.id,
      name: v.name,
      category: v.defaultCategory || 'Uncategorized',
      totalTransactions: v.totalTransactions,
      lastSeen: v.updatedAt,
      status: v.defaultCategory ? 'Auto-Categorized' : 'Needs Review',
    }));
  }

  async updateVendorCategory(userId: string, vendorId: string, category: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!userOrg) throw new NotFoundException('Organization not found');

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: userOrg.organizationId },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { defaultCategory: category },
    });
  }
}
