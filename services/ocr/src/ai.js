"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.parseTransactions = parseTransactions;
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
var database_1 = require("@ledgerlens/database");
function looksLikeTransactionPage(chunk) {
    var lines = chunk.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var hasDate = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{0,4})\b/i.test(line);
        // We intentionally keep this loose. False negatives (skipping real data) are catastrophic. 
        // A false positive (processing filler) just costs ~0.05 INR.
        // If it has NEITHER a date NOR an amount, it's flagged.
        var hasAmount = /\b(₹|\$|Rs\.?)?\s*\d{1,9}(,\d{3})*(\.\d{2})?\s*(cr|dr|\/-)?\b/i.test(line);
        if (hasDate || hasAmount) {
            return true;
        }
    }
    return false;
}
function parseTransactions(rawText, statementId) {
    return __awaiter(this, void 0, void 0, function () {
        var envPath, lines, chunks, currentChunk, _i, lines_2, line, remainingLine, allTransactions, sleep, chunkIndex, _a, chunks_1, chunk, statement, prompt_1, retries, maxRetries, success, lastError, _loop_1, errMsg;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    envPath = path.resolve(__dirname, '../../../.env');
                    dotenv.config({ path: envPath, override: true }); // Ensure latest .env is loaded
                    if (!process.env.GEMINI_API_KEY) {
                        throw new Error("GEMINI_API_KEY is missing. Please add your Gemini API key to the .env file.");
                    }
                    if (!process.env.GEMINI_PROXY_URL) {
                        throw new Error("GEMINI_PROXY_URL is missing.");
                    }
                    if (rawText.length > 150000) {
                        throw new Error("Statement is too large to process. Please split it into smaller files or fewer pages.");
                    }
                    lines = rawText.split('\n');
                    chunks = [];
                    currentChunk = '';
                    for (_i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                        line = lines_2[_i];
                        if (currentChunk.length + line.length > 7500) {
                            if (currentChunk.trim().length > 0)
                                chunks.push(currentChunk);
                            currentChunk = '';
                            // Forcefully slice massive single lines (e.g. PDFs missing newlines)
                            if (line.length > 7500) {
                                remainingLine = line;
                                while (remainingLine.length > 7500) {
                                    chunks.push(remainingLine.substring(0, 7500));
                                    remainingLine = remainingLine.substring(7500);
                                }
                                currentChunk = remainingLine + '\n';
                                continue;
                            }
                        }
                        currentChunk += line + '\n';
                    }
                    if (currentChunk.trim().length > 0) {
                        chunks.push(currentChunk);
                    }
                    allTransactions = [];
                    sleep = function (ms) { return new Promise(function (r) { return setTimeout(r, ms); }); };
                    chunkIndex = 0;
                    _a = 0, chunks_1 = chunks;
                    _b.label = 1;
                case 1:
                    if (!(_a < chunks_1.length)) return [3 /*break*/, 9];
                    chunk = chunks_1[_a];
                    chunkIndex++;
                    if (!!looksLikeTransactionPage(chunk)) return [3 /*break*/, 3];
                    console.log("[LOG-ONLY] Chunk ".concat(chunkIndex, " flagged for skipping (No dates or amounts found)."));
                    return [4 /*yield*/, database_1.prisma.skippedChunkLog.create({
                            data: {
                                statementId: statementId,
                                chunkIndex: chunkIndex,
                                charCount: chunk.length,
                                contentPreview: chunk.substring(0, 500),
                                isLogOnly: true
                            }
                        }).catch(function (err) { return console.error("Failed to log skipped chunk:", err); })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, database_1.prisma.statement.findUnique({
                        where: { id: statementId }
                    })];
                case 4:
                    statement = _b.sent();
                    if (!statement || statement.status === 'FAILED') {
                        console.log("Job cancelled mid-flight for statement ".concat(statementId, ". Stopping early."));
                        throw new Error("CANCELLED");
                    }
                    prompt_1 = "Extract the bank statement transactions from the following raw OCR text chunk. Focus on dates, times, amounts, transaction types (CREDIT or DEBIT), vendor names, and categorize them into standard financial categories. Ignore headers, footers, and non-transaction text.\n\n  CRITICAL: \n  - For 'date', you MUST convert and return the date strictly in YYYY-MM-DD format (e.g., \"2024-06-25\"), regardless of how it appears on the statement.\n  - For 'amount', you MUST extract the actual transaction amount (the Credit or Debit column). CRITICAL: Statement rows typically have 3 columns at the end: [Debit, Credit, Balance]. The Balance is almost ALWAYS the very last number on the row. The transaction amount is the number BEFORE the balance. NEVER output the Balance number as the amount! If a line only contains a balance, ignore it completely.\n  - For 'time', extract the exact time from the statement line (e.g. \"14:30\", \"2:30 PM\", \"14:30:00\"). If no time is explicitly visible on the line, leave it blank or null.\n  - For 'vendor', provide ONLY a short, clean business name (e.g., \"Amazon\", \"Uber\", \"Starbucks\"). Strip out any transaction IDs, terminal numbers, or filler words like \"POS\", \"UPI\", \"PAYMENT\".\n  - For 'narration', provide the exact full original text of the transaction line as it appears in the statement.\n  - For 'category', you MUST map it to one of the following standard categories: Income, Food & Dining, Travel & Transportation, Software & Subscriptions, Utilities & Bills, Rent & Housing, Salary & Payroll, Office Supplies, Marketing & Advertising, Bank Fees & Charges, Transfers & Investments, Healthcare & Insurance, Shopping & Retail, Entertainment & Leisure, Taxes & Fines, or Misc. \n  - CATEGORY RULES:\n    1. For generic UPI, NEFT, IMPS, RTGS, or wire transfers to/from individuals where the exact purpose is unknown, categorize as \"Transfers & Investments\".\n    2. Try your absolute best to infer the category from the vendor name before falling back to \"Misc\".\n\n  You MUST respond strictly with a valid JSON array of objects using exactly these keys:\n  [{\n    \"date\": \"YYYY-MM-DD\",\n    \"time\": \"HH:MM\",\n    \"amount\": 12.50,\n    \"type\": \"CREDIT\" | \"DEBIT\",\n    \"vendor\": \"Clean Merchant Name\",\n    \"category\": \"Food & Dining\",\n    \"narration\": \"Full original line\"\n  }]\n\n  Raw Text Chunk:\n  ".concat(chunk, "\n  ");
                    retries = 0;
                    maxRetries = 5;
                    success = false;
                    lastError = null;
                    _loop_1 = function () {
                        var controller_1, timeoutId_1, timeoutPromise, url, fetchPromise, result, errMsg, text, parsed, error_1, errMsg;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 10]);
                                    controller_1 = new AbortController();
                                    timeoutPromise = new Promise(function (_, reject) {
                                        timeoutId_1 = setTimeout(function () {
                                            controller_1.abort();
                                            reject(new Error("NETWORK_TIMEOUT"));
                                        }, 60000);
                                    });
                                    url = "".concat(process.env.GEMINI_PROXY_URL, "/v1beta/models/gemini-2.5-flash:generateContent");
                                    fetchPromise = fetch(url, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'x-goog-api-key': process.env.GEMINI_API_KEY,
                                        },
                                        body: JSON.stringify({
                                            contents: [{ parts: [{ text: prompt_1 }] }],
                                            generationConfig: { responseMimeType: "application/json" }
                                        }),
                                        signal: controller_1.signal
                                    }).then(function (res) { return __awaiter(_this, void 0, void 0, function () {
                                        var contentType, text_1;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    contentType = res.headers.get('content-type');
                                                    if (!(!contentType || !contentType.includes('application/json'))) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, res.text()];
                                                case 1:
                                                    text_1 = _a.sent();
                                                    throw new Error("[PROXY_ERROR] Non-JSON response from proxy: ".concat(text_1.substring(0, 50), "..."));
                                                case 2: return [2 /*return*/, res.json()];
                                            }
                                        });
                                    }); });
                                    return [4 /*yield*/, Promise.race([
                                            fetchPromise,
                                            timeoutPromise
                                        ])];
                                case 1:
                                    result = _c.sent();
                                    clearTimeout(timeoutId_1);
                                    if (result.error) {
                                        errMsg = result.error.message || "Gemini API Error";
                                        throw new Error("[".concat(result.error.code || 500, "] ").concat(errMsg));
                                    }
                                    text = result.candidates[0].content.parts[0].text;
                                    // Strip markdown backticks if present
                                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                                    parsed = JSON.parse(text);
                                    if (Array.isArray(parsed)) {
                                        allTransactions = allTransactions.concat(parsed);
                                    }
                                    success = true;
                                    return [3 /*break*/, 10];
                                case 2:
                                    error_1 = _c.sent();
                                    lastError = error_1;
                                    errMsg = String((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || "");
                                    if (!((error_1 === null || error_1 === void 0 ? void 0 : error_1.status) === 429 || errMsg.includes('429'))) return [3 /*break*/, 4];
                                    console.log("Rate limit hit on chunk. Waiting 30s before retry...");
                                    return [4 /*yield*/, sleep(30000)];
                                case 3:
                                    _c.sent();
                                    retries++;
                                    return [3 /*break*/, 9];
                                case 4:
                                    if (!((error_1 === null || error_1 === void 0 ? void 0 : error_1.status) === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('overloaded'))) return [3 /*break*/, 6];
                                    console.log("Gemini is experiencing high demand (503). Waiting 10s before retry...");
                                    return [4 /*yield*/, sleep(10000)];
                                case 5:
                                    _c.sent();
                                    retries++;
                                    return [3 /*break*/, 9];
                                case 6:
                                    if (!(errMsg === "NETWORK_TIMEOUT" || errMsg.includes('timeout') || errMsg.includes('PROXY_ERROR'))) return [3 /*break*/, 8];
                                    console.log("Request timed out or proxy failed (likely Vercel killed connection). Waiting 5s before retry...");
                                    return [4 /*yield*/, sleep(5000)];
                                case 7:
                                    _c.sent();
                                    retries++;
                                    return [3 /*break*/, 9];
                                case 8:
                                    console.error("Failed to parse Gemini JSON for a chunk:", error_1);
                                    throw error_1; // Throw so the worker marks it as FAILED
                                case 9: return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    };
                    _b.label = 5;
                case 5:
                    if (!(retries < maxRetries && !success)) return [3 /*break*/, 7];
                    return [5 /*yield**/, _loop_1()];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 7:
                    if (!success) {
                        errMsg = String((lastError === null || lastError === void 0 ? void 0 : lastError.message) || "");
                        if ((lastError === null || lastError === void 0 ? void 0 : lastError.status) === 429 || errMsg.includes('429')) {
                            throw new Error("RATE_LIMIT");
                        }
                        throw lastError || new Error("Exhausted retries for chunk.");
                    }
                    _b.label = 8;
                case 8:
                    _a++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, allTransactions];
            }
        });
    });
}
