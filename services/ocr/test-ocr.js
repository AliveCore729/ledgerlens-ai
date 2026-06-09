"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@ledgerlens/database");
const extractor_1 = require("./src/extractor");
const ai_1 = require("./src/ai");
async function test() {
    const statement = await database_1.prisma.statement.findUnique({
        where: { id: '12aa48f5-5d5a-476d-81f3-12ca07c90d96' }
    });
    if (!statement)
        return console.log('Statement not found');
    try {
        const rawText = await (0, extractor_1.extractText)(statement.fileUrl, statement.mimeType);
        console.log("Raw text length:", rawText.length);
        const parsedTransactions = await (0, ai_1.parseTransactions)(rawText);
        console.log('Parsed successfully! Length:', parsedTransactions.length);
    }
    catch (error) {
        console.error('Error occurred:', error);
    }
}
test().finally(() => process.exit(0));
//# sourceMappingURL=test-ocr.js.map