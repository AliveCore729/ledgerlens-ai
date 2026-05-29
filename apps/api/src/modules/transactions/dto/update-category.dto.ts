import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const ALLOWED_CATEGORIES = [
  'Salary', 'Fuel', 'Rent', 'Food', 'Electricity', 'Insurance',
  'Loan', 'Tax', 'Purchase', 'Sales', 'Miscellaneous', 'Transfer', 'ATM'
];

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Food', description: 'The mapped category for the transaction' })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CATEGORIES, {
    message: `category must be one of the following values: ${ALLOWED_CATEGORIES.join(', ')}`,
  })
  category!: string;
}