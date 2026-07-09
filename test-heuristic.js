"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function looksLikeTransactionPage(chunk) {
    var lines = chunk.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var hasDate = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{0,4})\b/i.test(line);
        var hasAmount = /\b(₹|\$|Rs\.?)?\s*\d{1,9}(,\d{3})*(\.\d{2})?\s*(cr|dr|\/-)?\b/i.test(line);
        if (hasDate || hasAmount) {
            return true;
        }
    }
    return false;
}
var testCases = [
    {
        name: "Clean Statement with T&C",
        chunks: [
            "Date      Description      Amount     Balance\n12/04/2023 Amazon          $14.50     $1,200.00\n15/04/2023 Uber            $12.00     $1,188.00",
            "TERMS AND CONDITIONS\n\n1. Introduction\nThese terms govern your use of the account.\n2. Interest Rates\nThe annual percentage rate is 15%.\nCall us at 1-800-555-1234 for help."
        ]
    },
    {
        name: "Non-Standard Date Statement",
        chunks: [
            "Date      Description      Amount     Balance\n05-04     Target           50.00      1138.00\n2024.12.01 Walmart         100.00     1038.00"
        ]
    },
    {
        name: "Wrapped Transaction Rows",
        chunks: [
            "Date\nDescription\nAmount\nBalance\n12/04/2023\nStarbucks\n$4.50\n$1,033.50"
        ]
    }
];
var totalChunks = 0;
var skippedChunks = 0;
for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
    var test_1 = testCases_1[_i];
    console.log("\nRunning Test: ".concat(test_1.name));
    for (var i = 0; i < test_1.chunks.length; i++) {
        totalChunks++;
        var chunk = test_1.chunks[i];
        var keep = looksLikeTransactionPage(chunk);
        if (!keep) {
            skippedChunks++;
            console.log("[FLAGGED FOR SKIP] Chunk ".concat(i + 1, ":\n").concat(chunk, "\n"));
        }
        else {
            console.log("[PRESERVED] Chunk ".concat(i + 1, " survives filter."));
        }
    }
}
console.log("\nResult: ".concat(skippedChunks, "/").concat(totalChunks, " chunks (").concat(Math.round(skippedChunks / totalChunks * 100), "%) flagged as skippable."));
