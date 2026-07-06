import type { Response } from 'express';
import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, StreamableFile, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveSessionGuard } from "../auth/active-session.guard";
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

  @Get('review')
  getReviewPending(@CurrentUser() user: any) {
    return this.transactionsService.getReviewPending(user.userId);
  }

  @Get('categorization-summary')
  getCategorizationSummary(@CurrentUser() user: any) {
    return this.transactionsService.getCategorizationSummary(user.userId);
  }

  @Post('bulk-review')
  bulkReview(@CurrentUser() user: any, @Body() body: { ids: string[] }) {
    return this.transactionsService.bulkReview(user.userId, body.ids);
  }

  @Patch(':id/review')
  reviewTransaction(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { category?: string }
  ) {
    return this.transactionsService.reviewTransaction(id, user.userId, body.category);
  }

  @UseGuards(ActiveSessionGuard)
  @Get('export')
  async export(
    @CurrentUser() user: any,
    @Query() query: QueryTransactionsDto,
    @Res({ passthrough: true }) res: Response,
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