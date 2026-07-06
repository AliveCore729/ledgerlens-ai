import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveSessionGuard } from '../auth/active-session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, ActiveSessionGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  getVendors(@CurrentUser() user: any) {
    return this.vendorsService.getVendors(user.userId);
  }

  @Patch(':id/category')
  updateVendorCategory(
    @CurrentUser() user: any,
    @Param('id') vendorId: string,
    @Body('category') category: string
  ) {
    return this.vendorsService.updateVendorCategory(user.userId, vendorId, category);
  }
}
