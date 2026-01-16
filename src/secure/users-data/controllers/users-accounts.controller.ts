import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { UsersDataService } from '../services/users-data.service';
import { SearchQueryDto } from '../../../shared/crud/dto/search-query.dto';

@ApiTags('21.2 Users Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('usersAccounts')
@UseGuards(JwtAuthGuard)
export class UsersAccountsController {
  constructor(private readonly usersDataService: UsersDataService) {}

  @Get()
  @ApiOperation({ summary: 'Search users accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    return this.usersDataService.searchAccounts(query, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  async select(@Param('id') id: string, @Request() req: any) {
    return this.usersDataService.selectAccount(id, req.user?.userId);
  }
}
