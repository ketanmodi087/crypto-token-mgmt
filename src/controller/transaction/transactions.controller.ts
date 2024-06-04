import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import axios from "axios";
import { TransactionsService } from "src/service/transaction/transactions.service";
import { ConfigService } from "@nestjs/config";
import { UserService } from "src/service/user/users.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ITransaction } from "src/interface/transactions.interface";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private readonly transactionService: TransactionsService,
    @InjectModel("transaction") private transactionModel: Model<ITransaction>
  ) {}

  @Post("/getCryptoAmountDetails")
  async getCryptoAmountDetails(
    @Req() req: any,
    @Res() response,
    @Body() body: { usdAmount: any; cryptoSymbol: any }
  ) {
    try {
      if (!req.body.cryptoSymbol) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: "Please select crypto currency",
        });
      } else {
        let cryptoAmount = null;
        if (req.body.cryptoSymbol == "USD") {
          cryptoAmount = body.usdAmount * 0.49;
        } else {
          let responseData = await axios.get(
            `https://api.coingate.com/v2/rates/merchant/${req.body.cryptoSymbol}/USD`
          );
          let amountUSD = body.usdAmount * responseData.data;
          cryptoAmount = amountUSD * 0.49;
        }
        if (cryptoAmount) {
          return response.status(HttpStatus.OK).json({
            message: `${req.body.cryptoSymbol}: ${req.body.usdAmount} => MID: ${cryptoAmount}`,
            amount: cryptoAmount,
          });
        } else {
          return response.status(HttpStatus.OK).json({
            message: "Something went wrong",
          });
        }
      }
    } catch (err) {
      return response.status(err.status).json(err.response);
    }
  }

  @Get("/getTransactions")
  async getTransactions(@Req() req, @Res() response) {
    const page = req.query.page ? req.query.page : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;
    const transactions = await this.transactionService.getTransaction(
      req.headers.authData.verifiedAddress,
      page,
      pageSize
    );
    const transactionsCount = await this.transactionService.getTransactionCount(
      req.headers.authData.verifiedAddress
    );
    if (transactions) {
      return response.status(HttpStatus.OK).json({
        message: "Transactions get successfully",
        transactions: transactions,
        totalTransactionsCount: transactionsCount,
      });
    } else {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: "Something went wrong",
      });
    }
  }

  @Get("/getTokenCount")
  async getTokenCount(@Req() req: any, @Res() response) {
    try {
      const transactions = await this.transactionService.getTransaction(
        req.headers.authData.verifiedAddress
      );
      let gbpCount = 0;
      let eurCount = 0;
      let audCount = 0;
      if (transactions) {
        for (const transaction of transactions) {
          if (transaction.status === "paid") {
            if (transaction.price_currency === "EUR")
              eurCount += parseFloat(transaction.price_amount);
            if (transaction.price_currency === "AUD")
              audCount += parseFloat(transaction.price_amount);
            if (transaction.price_currency === "GBP")
              gbpCount += parseFloat(transaction.price_amount);
          }
        }
      }
      const tokenData = {
        gbpCount: gbpCount.toFixed(2),
        audCount: audCount.toFixed(2),
        eurCount: eurCount.toFixed(2),
      };
      if (tokenData) {
        return response.status(HttpStatus.OK).json({
          message: "get TotalAmount Amount Successfully",
          tokenData: tokenData,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Something went wrong",
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: "Something went wrong",
      });
    }
  }

  @Post("/getSaleGrapthValues")
  async getSaleGrapthValues(@Req() req: any, @Res() response) {
    try {
      const option = req.body.option;
      const from_date = req.body.from_date;
      const to_date = req.body.to_date;
      const transactionData = await this.transactionService.getSaleGraphValue(
        req.headers.authData.verifiedAddress,
        option,
        from_date,
        to_date
      );
      const totalToken = await this.transactionService.getSaleGraphTotalToken(
        req.headers.authData.verifiedAddress,
        from_date,
        to_date
      );
      if (transactionData) {
        return response.status(HttpStatus.OK).json({
          message: "get TotalAmount Amount Successfully",
          transactionData: transactionData,
          totalToken: totalToken,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Something went wrong",
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: "Something went wrong",
      });
    }
  }

  @Post("/getLineGrapthValues")
  async getLineGrapthValues(@Req() req: any, @Res() response) {
    try {
      const option = req.body.option;
      const from_date = req.body.from_date;
      const to_date = req.body.to_date;
      const transactionData = await this.transactionService.getLineGraphValue(
        req.headers.authData.verifiedAddress,
        option,
        from_date,
        to_date
      );
      const totalToken = await this.transactionService.getLineGraphTotalToken(
        req.headers.authData.verifiedAddress,
        from_date,
        to_date
      );
      if (transactionData) {
        return response.status(HttpStatus.OK).json({
          message: "get TotalAmount Amount Successfully",
          transactionData: transactionData,
          totalToken: totalToken,
        });
      } else {
        return response.status(HttpStatus.OK).json({
          message: "Something went wrong",
        });
      }
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: "Something went wrong",
      });
    }
  }
}
