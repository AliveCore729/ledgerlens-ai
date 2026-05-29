import express from 'express';
import { Controller, Get, Patch, Body, Param, Query, UseGuards, StreamableFile, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.findAll(user.userId, query);
  }

  @Get('export')
  async export(
    @CurrentUser() user: any,
    @Query() query: QueryTransactionsDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const csvString = await this.transactionsService.getExportData(user.userId, query);
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(Buffer.from(csvString));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.findOne(id, user.userId);
  }

  @Patch(':id/category')
  updateCategory(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.transactionsService.updateCategory(id, user.userId, updateCategoryDto);
  }
}