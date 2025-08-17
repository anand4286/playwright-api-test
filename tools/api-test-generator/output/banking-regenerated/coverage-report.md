# API Test Coverage Report

## Summary
- **Total Endpoints**: 14
- **Total Tests Generated**: 28
- **Coverage**: 100.0%

## Endpoints Coverage

| Method | Path | Operation ID | Status |
|--------|------|--------------|--------|
| GET | /accounts | listAccounts | ✅ Covered |\n| POST | /accounts | createAccount | ✅ Covered |\n| GET | /accounts/{accountId} | getAccount | ✅ Covered |\n| PATCH | /accounts/{accountId} | updateAccount | ✅ Covered |\n| GET | /accounts/{accountId}/transactions | getAccountTransactions | ✅ Covered |\n| POST | /transfers | createTransfer | ✅ Covered |\n| GET | /transfers/{transferId} | getTransfer | ✅ Covered |\n| DELETE | /transfers/{transferId} | cancelTransfer | ✅ Covered |\n| GET | /payments/bills | getBillPayments | ✅ Covered |\n| POST | /payments/bills | scheduleBillPayment | ✅ Covered |\n| GET | /loans | getLoans | ✅ Covered |\n| POST | /loans/{loanId}/payments | makeLoanPayment | ✅ Covered |\n| GET | /cards | getCards | ✅ Covered |\n| POST | /cards/{cardId}/block | blockCard | ✅ Covered |

## Test Files Generated
- accounts.spec.ts\n- transactions.spec.ts\n- transfers.spec.ts\n- payments.spec.ts\n- loans.spec.ts\n- cards.spec.ts

Generated on: 2025-08-17T10:58:41.564Z
