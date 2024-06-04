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
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model } from "mongoose";
import { ITransaction } from "src/interface/transactions.interface";
import { TransactionsService } from "src/service/transaction/transactions.service";
import { UserService } from "src/service/user/users.service";
var jwt = require("jsonwebtoken");
const getSignMessage = (address, nonce) => {
  return `Please sign this message for address ${address}:\n\n${nonce}`;
};
const Web3 = require("web3");
const jwtSecret = "eplba";
const web3 = new Web3("https://cloudflare-eth.com/");

@Controller("auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionsService,
    @InjectModel("transaction") private transactionModel: Model<ITransaction>
  ) {}
  @Get("/nonce/:addressId")
  async generateToken(@Res() response, @Param() param: { addressId: string }) {
    try {
      const nonce = new Date().getTime();
      const address = param.addressId;
      const tempToken = jwt.sign({ nonce, address }, jwtSecret, {
        expiresIn: "120s",
      });
      const message = getSignMessage(address, nonce);
      return response.json({ tempToken, message });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }
  @Get("/getuser/:address")
  async getUserDetailByAddress(
    @Res() response,
    @Param("address") address: string
  ) {
    try {
      let user = await this.userService.getOnlyUserBioByAddress(address);

      let docUrl = "";
      if (user.profile) {
        const s3 = this.configService.get("s3");
        const bucketName = this.configService.get("aws_s3_bucket_name");
        docUrl = await s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: user.profile ? user.profile : "",
          Expires: 604800,
        });
      }

      user.fname_alias = user.fname_alias ? user.fname_alias : "John";
      user.lname_alias = user.lname_alias ? user.lname_alias : "Doe";
      return response.json({ docUrl: docUrl, user: user });
    } catch (err) {
      return response.status(HttpStatus.BAD_REQUEST).json(err.response);
    }
  }

  @Post("/createOrder")
  async createOrder(@Req() req: any, @Res() response) {
    const coingate_token = this.configService.get("coingate_token");
    const res = await axios.post(
      "https://api-sandbox.coingate.com/v2/orders",
      {
        price_amount: Number(req.body?.amount),
        price_currency: req.body?.crypto_currency,
        receive_currency: "USD",
        callback_url: "http://164.90.183.188:5000/orders/callback",
        success_url: "https://ico.middn.com/transaction?success=true",
        cancel_url: "https://ico.middn.com/buy-token?success=true",
      },
      {
        headers: {
          Authorization: `Bearer ${coingate_token}`,
        },
      }
    );
    const transaction = await this.transactionService.createTransaction(
      res.data,
      req.body?.wallet_address,
      req.body?.cryptoAmount
    );
    if (transaction) {
      return response.status(HttpStatus.OK).json({
        message: "Order create successfully",
        data: res.data,
      });
    } else {
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
      const address = null;
      const transactionData = await this.transactionService.getSaleGraphValue(
        address,
        option,
        from_date,
        to_date
      );
      const totalToken = await this.transactionService.getSaleGraphTotalToken(
        address,
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
  @Get("/getTotalMid")
  async getTotalMid(@Req() req: any, @Res() response) {
    try {
      const transactions = await this.transactionModel.find();
      let totalAmount = 0;

      for (const transaction of transactions) {
        if (transaction.status === "paid") {
          totalAmount += parseFloat(transaction.token_cryptoAmount);
        }
      }
      if (totalAmount) {
        return response.status(HttpStatus.OK).json({
          message: "get TotalAmount Amount Successfully",
          totalAmount: totalAmount,
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
