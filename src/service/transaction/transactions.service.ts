import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ITransaction } from "src/interface/transactions.interface";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as moment from "moment";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel("transaction") private transactionModel: Model<ITransaction>,
    private configService: ConfigService
  ) {}
  async createTransaction(data, wallet_address, cryptoAmount): Promise<any> {
    const newTransaction = await new this.transactionModel({
      tran_id: data.id,
      status: data.status,
      title: data.title,
      do_not_convert: data.do_not_convert,
      orderable_type: data.orderable_type,
      orderable_id: data.orderable_id,
      price_currency: data.price_currency,
      price_amount: data.price_amount,
      lightning_network: data.lightning_network,
      receive_currency: data.receive_currency,
      receive_amount: data.receive_amount,
      created_at: data.created_at,
      order_id: data.order_id,
      payment_url: data.payment_url,
      underpaid_amount: data.underpaid_amount,
      overpaid_amount: data.overpaid_amount,
      is_refundable: data.is_refundable,
      refunds: data.refunds,
      voids: data.voids,
      fees: data.fees,
      token: data.token,
      transaction_status: "Pending",
      wallet_address: wallet_address,
      token_cryptoAmount: cryptoAmount,
    });
    return newTransaction.save();
  }

  async getTransaction(
    address: string,
    page?: number,
    pageSize?: number
  ): Promise<any> {
    let transactionsQuery = address
      ? this.transactionModel.find({
          wallet_address: address,
        })
      : this.transactionModel.find();

    if (page && pageSize) {
      // Calculate the number of documents to skip
      const skipCount = (page - 1) * pageSize;
      transactionsQuery = transactionsQuery.skip(skipCount).limit(pageSize);
    }
    const transactions = await transactionsQuery
      .sort({ created_at: "desc" })
      .exec();

    if (!transactions) {
      throw new NotFoundException(`Address #${address} not found`);
    }
    return transactions;
  }

  async getTransactionCount(address: string) {
    return await this.transactionModel
      .countDocuments({ wallet_address: address })
      .exec();
  }

  async getSaleGraphTotalToken(
    address: any,
    from_date: any,
    to_date: any
  ): Promise<any> {
    let woToken: {
      status: string;
      created_at: { $gt: any; $lt: any };
      wallet_address?: any;
    } = {
      status: "paid",
      created_at: { $gt: from_date, $lt: to_date },
    };
    if (address !== null) {
      woToken = {
        ...woToken,
        wallet_address: address,
      };
    }

    let totalToken = await this.transactionModel
      .aggregate([
        {
          $match: woToken,
        },
        {
          $group: {
            _id: address ? "$wallet_address" : null,
            totalToken: { $sum: 1 },
          },
        },
      ])
      .exec();
    totalToken =
      totalToken.length && totalToken[0] ? totalToken[0].totalToken : 0;
    return totalToken;
  }

  async getSaleGraphValue(
    address,
    filterType: any,
    from_date: any,
    to_date: any
  ): Promise<any> {
    let woToken: {
      status: string;
      created_at: { $gt: any; $lt: any };
      wallet_address?: any;
    } = {
      status: "paid",
      created_at: { $gt: from_date, $lt: to_date },
    };
    if (address !== null) {
      woToken = {
        ...woToken,
        wallet_address: address,
      };
    }
    const transactions = await this.transactionModel
      .aggregate([
        {
          $match: woToken,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  filterType === "todayDate" ||
                  filterType === "lastWeek" ||
                  filterType === "lastMonth"
                    ? "%Y-%m-%d"
                    : "%Y-%m",
                date: { $toDate: "$created_at" },
              },
            },
            value: { $sum: 1 },
          },
        },
        {
          $addFields: {
            label: "$_id",
          },
        },
        {
          $sort: {
            label: 1,
          },
        },
      ])
      .exec();
    let mainDates = [];
    if (filterType == "todayDate") {
      mainDates.push(moment().format("YYYY-MM-DD"));
    }
    if (filterType == "lastWeek") {
      const previousWeekStart = moment().subtract(1, "weeks").startOf("week");
      for (let i = 0; i < 7; i++) {
        const currentDate = previousWeekStart
          .clone()
          .add(i, "days")
          .format("YYYY-MM-DD");
        mainDates.push(currentDate);
      }
    }
    if (filterType == "lastMonth") {
      const startDate = moment().subtract(1, "month").startOf("month");
      const endDate = moment().subtract(1, "month").endOf("month");
      let currentDatePointer = startDate.clone();

      while (currentDatePointer.isSameOrBefore(endDate, "day")) {
        mainDates.push(currentDatePointer.format("YYYY-MM-DD"));
        currentDatePointer.add(1, "day");
      }
    }
    if (filterType == "last3Months") {
      const currentMonth = moment();
      for (let i = 0; i < 3; i++) {
        const previousMonth = currentMonth.clone().subtract(i + 1, "months");
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
      mainDates = mainDates.reverse();
    }
    if (filterType == "last6Months") {
      const currentMonth = moment();
      for (let i = 0; i < 6; i++) {
        const previousMonth = currentMonth.clone().subtract(i + 1, "months");
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
      mainDates = mainDates.reverse();
    }
    if (filterType == "lastYear") {
      const currentYear = moment().year();
      for (let i = 0; i < 12; i++) {
        const previousMonth = moment()
          .year(currentYear - 1)
          .month(i);
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
    }

    let data = transactions?.map((trans) => {
      let key = trans.label;
      return { [key]: trans.value };
    });
    data = { ...Object.assign({}, ...data) };

    const result = mainDates?.map((d) => {
      if (data[d]) {
        return { label: d, value: data[d] };
      } else {
        return { label: d, value: 0 };
      }
    });
    return result;
  }

  async getLineGraphTotalToken(
    address: any,
    from_date: any,
    to_date: any
  ): Promise<any> {
    let woToken: {
      status: string;
      created_at: { $gt: any; $lt: any };
      wallet_address?: any;
    } = {
      status: "paid",
      created_at: { $gt: from_date, $lt: to_date },
    };
    if (address !== null) {
      woToken = {
        ...woToken,
        wallet_address: address,
      };
    }

    let totalToken = await this.transactionModel
      .aggregate([
        {
          $match: woToken,
        },
        {
          $group: {
            _id: address ? "$wallet_address" : null,
            totalToken: { $sum: 1 },
          },
        },
      ])
      .exec();
    totalToken =
      totalToken.length && totalToken[0] ? totalToken[0].totalToken : 0;
    return totalToken;
  }

  async getLineGraphValue(
    address,
    filterType: any,
    from_date: any,
    to_date: any
  ): Promise<any> {
    let woToken: {
      status: string;
      created_at: { $gt: any; $lt: any };
      wallet_address?: any;
    } = {
      status: "paid",
      created_at: { $gt: from_date, $lt: to_date },
    };
    if (address !== null) {
      woToken = {
        ...woToken,
        wallet_address: address,
      };
    }
    const transactions = await this.transactionModel
      .aggregate([
        {
          $match: woToken,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  filterType === "todayDate" ||
                  filterType === "lastWeek" ||
                  filterType === "lastMonth"
                    ? "%Y-%m-%d"
                    : "%Y-%m",
                date: { $toDate: "$created_at" },
              },
            },
            value: { $sum: 1 },
          },
        },
        {
          $addFields: {
            label: "$_id",
          },
        },
        {
          $sort: {
            label: 1,
          },
        },
      ])
      .exec();
    const mainDates = [];
    if (filterType == "todayDate") {
      mainDates.push(moment().subtract(1,"days").format("YYYY-MM-DD"));
    }
    if (filterType == "lastWeek") {
      const previousWeekStart = moment().subtract(2, "weeks").startOf("week");
      for (let i = 0; i < 7; i++) {
        const currentDate = previousWeekStart
          .clone()
          .add(i, "days")
          .format("YYYY-MM-DD");
        mainDates.push(currentDate);
      }
    }
    if (filterType == "lastMonth") {
      const startDate = moment().subtract(2, "month").startOf("month");
      const endDate = moment().subtract(2, "month").endOf("month");
      let currentDatePointer = startDate.clone();

      while (currentDatePointer.isSameOrBefore(endDate, "day")) {
        mainDates.push(currentDatePointer.format("YYYY-MM-DD"));
        currentDatePointer.add(1, "day");
      }
    }
    if (filterType == "last3Months") {
      const currentMonth = moment();
      for (let i = 3; i < 6; i++) {
        const previousMonth = currentMonth.clone().subtract(i + 1, "months");
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
    }
    if (filterType == "last6Months") {
      const currentMonth = moment();
      for (let i = 6; i < 12; i++) {
        const previousMonth = currentMonth.clone().subtract(i + 1, "months");
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
    }
    if (filterType == "lastYear") {
      const currentYear = moment().year();
      for (let i = 0; i < 12; i++) {
        const previousMonth = moment()
          .year(currentYear - 2)
          .month(i);
        const formattedMonth = previousMonth.format("YYYY-MM");
        mainDates.push(formattedMonth);
      }
    }
    let data = transactions?.map((trans) => {
      let key = trans.label;
      return { [key]: trans.value };
    });
    data = { ...Object.assign({}, ...data) };

    const result = mainDates?.map((d) => {
      if (data[d]) {
        return { label: d, value: data[d] };
      } else {
        return { label: d, value: 0 };
      }
    });
    return result;
  }
}
