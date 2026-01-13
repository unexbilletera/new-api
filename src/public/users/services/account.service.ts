import { Injectable, NotFoundException } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { AccountModel } from '../models/account.model';
import {
  SetDefaultAccountDto,
  SetUserAccountAliasDto,
} from '../dto/user-profile.dto';
import {
  AccountListResponseDto,
  AccountBalanceResponseDto,
} from '../dto/response';

@Injectable()
export class AccountService {
  constructor(
    private userModel: UserModel,
    private accountModel: AccountModel,
  ) {}

  async getUserAccounts(userId: string): Promise<AccountListResponseDto> {
    const accounts = await this.userModel.getUserAccounts(userId);

    return {
      accounts: accounts.map((a: any) => ({
        id: a.id,
        type: a.type,
        currency: a.currency,
        balance: a.balance,
        alias: a.alias,
        status: a.status,
      })),
    };
  }

  async setDefaultAccount(userId: string, dto: SetDefaultAccountDto) {
    await this.userModel.setDefaultAccount(userId, dto.accountId);

    return { message: 'Default account set' };
  }

  async setUserAccountAlias(userId: string, accountId: string, alias: string) {
    await this.userModel.updateAccountAlias(accountId, alias);

    return { message: 'Account alias updated' };
  }

  async getAccountBalances(userId: string): Promise<AccountBalanceResponseDto> {
    const accounts = await this.userModel.getUserAccounts(userId);

    return {
      accounts: accounts.map((a: any) => ({
        id: a.id,
        type: a.type,
        currency: a.currency,
        balance: a.balance,
        alias: a.alias,
        status: a.status,
      })),
    };
  }

  async getUserAccountInfo(accountId: string) {
    const account = await this.userModel.getAccountById(accountId);

    if (!account) {
      throw new NotFoundException('users.errors.accountNotFound');
    }

    return { account };
  }
}
