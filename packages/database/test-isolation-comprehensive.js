"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var userA1, userA2, userB, orgA, orgB, statementOrgA, transactionOrgA, statementPositive, statementNegative, transactionPositive, transactionNegative;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Setting up test data...");
                    return [4 /*yield*/, prisma.user.create({ data: { email: 'userA1@test.com', firstName: 'A1' } })];
                case 1:
                    userA1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({ data: { email: 'userA2@test.com', firstName: 'A2' } })];
                case 2:
                    userA2 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({ data: { email: 'userB@test.com', firstName: 'B' } })];
                case 3:
                    userB = _a.sent();
                    return [4 /*yield*/, prisma.organization.create({ data: { name: 'Org A' } })];
                case 4:
                    orgA = _a.sent();
                    return [4 /*yield*/, prisma.organization.create({ data: { name: 'Org B' } })];
                case 5:
                    orgB = _a.sent();
                    return [4 /*yield*/, prisma.organizationUser.create({ data: { userId: userA1.id, organizationId: orgA.id } })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.organizationUser.create({ data: { userId: userA2.id, organizationId: orgA.id } })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.organizationUser.create({ data: { userId: userB.id, organizationId: orgB.id } })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.statement.create({
                            data: {
                                fileName: 'secret-a.pdf',
                                fileUrl: '/tmp/a.pdf',
                                mimeType: 'application/pdf',
                                size: 1024,
                                organizationId: orgA.id,
                                uploadedById: userA1.id
                            }
                        })];
                case 9:
                    statementOrgA = _a.sent();
                    return [4 /*yield*/, prisma.transaction.create({
                            data: {
                                statementId: statementOrgA.id,
                                date: new Date().toISOString(),
                                vendor: 'Secret Vendor', type: 'DEBIT',
                                amount: 100.0,
                            }
                        })];
                case 10:
                    transactionOrgA = _a.sent();
                    console.log("\n--- TEST 1: POSITIVE STATEMENT ACCESS ---");
                    return [4 /*yield*/, prisma.statement.findFirst({
                            where: {
                                id: statementOrgA.id,
                                organization: { organizationUsers: { some: { userId: userA2.id } } }
                            }
                        })];
                case 11:
                    statementPositive = _a.sent();
                    if (statementPositive)
                        console.log("✅ PASSED: UserA2 (same org) successfully accessed Statement.");
                    else
                        console.log("❌ FAILED: UserA2 could not access Statement.");
                    console.log("\n--- TEST 2: NEGATIVE STATEMENT ACCESS ---");
                    return [4 /*yield*/, prisma.statement.findFirst({
                            where: {
                                id: statementOrgA.id,
                                organization: { organizationUsers: { some: { userId: userB.id } } }
                            }
                        })];
                case 12:
                    statementNegative = _a.sent();
                    if (!statementNegative)
                        console.log("✅ PASSED: UserB (different org) blocked from Statement.");
                    else
                        console.log("❌ FAILED: UserB accessed Statement.");
                    console.log("\n--- TEST 3: POSITIVE TRANSACTION ACCESS ---");
                    return [4 /*yield*/, prisma.transaction.findFirst({
                            where: {
                                id: transactionOrgA.id,
                                statement: { organization: { organizationUsers: { some: { userId: userA2.id } } } }
                            }
                        })];
                case 13:
                    transactionPositive = _a.sent();
                    if (transactionPositive)
                        console.log("✅ PASSED: UserA2 (same org) successfully accessed Transaction.");
                    else
                        console.log("❌ FAILED: UserA2 could not access Transaction.");
                    console.log("\n--- TEST 4: NEGATIVE TRANSACTION ACCESS ---");
                    return [4 /*yield*/, prisma.transaction.findFirst({
                            where: {
                                id: transactionOrgA.id,
                                statement: { organization: { organizationUsers: { some: { userId: userB.id } } } }
                            }
                        })];
                case 14:
                    transactionNegative = _a.sent();
                    if (!transactionNegative)
                        console.log("✅ PASSED: UserB (different org) blocked from Transaction.");
                    else
                        console.log("❌ FAILED: UserB accessed Transaction.");
                    // Cleanup
                    console.log("\nCleaning up...");
                    return [4 /*yield*/, prisma.transaction.delete({ where: { id: transactionOrgA.id } })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, prisma.statement.delete({ where: { id: statementOrgA.id } })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, prisma.organization.delete({ where: { id: orgA.id } })];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, prisma.organization.delete({ where: { id: orgB.id } })];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.delete({ where: { id: userA1.id } })];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.delete({ where: { id: userA2.id } })];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.delete({ where: { id: userB.id } })];
                case 21:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });
