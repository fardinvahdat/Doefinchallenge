const { ethers } = require("hardhat");
require("dotenv").config();

// Import utility functions from test utils
const {
  QuestionType,
  encodeDifficultyThreshold,
  encodeDifficultyRange,
  encodeBlockCount,
  encodeMiningDuration,
} = require("../../test/utils/oracleAdapterUtils.js");

async function main() {
    console.log("🚀 Creating condition with metadata (Oracle Adapter questions)...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Operating with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // Configuration from .env
    const DIAMOND_ADDRESS = process.env.DIAMOND_ADDRESS;
    
    if (!DIAMOND_ADDRESS) {
        throw new Error("❌ Please set DIAMOND_ADDRESS in .env file");
    }
    
    console.log("💎 Diamond Address:", DIAMOND_ADDRESS);
    
    // Get contract interfaces
    console.log("\n1️⃣ Connecting to Diamond contracts...");
    const ConditionManagerFacet = await ethers.getContractFactory("ConditionManagerFacet");
    const diamond = ConditionManagerFacet.attach(DIAMOND_ADDRESS);
    
    // Get block header oracle interface
    const blockHeaderOracle = await ethers.getContractAt("IDoefinBlockHeaderOracle", DIAMOND_ADDRESS);
    
    // Get current block height for validation
    const currentBlockHeight = await blockHeaderOracle.getCurrentBlockHeight();
    console.log("📊 Current block height:", currentBlockHeight.toString());
    
    // === BATCH CONFIGURATION ===
    // List of [blockNumber, difficulty] pairs
    const batchConfigs = [
        { blockNumber: 935810, difficulty: "141668107417560" },
        { blockNumber: 935810, difficulty: "143000000000000" },
        { blockNumber: 935954, difficulty: "141700000000000" },
        { blockNumber: 935954, difficulty: "143500000000000" },
        { blockNumber: 936098, difficulty: "140000000000000" },
        { blockNumber: 936098, difficulty: "141800000000000" },
        { blockNumber: 936242, difficulty: "139000000000000" },
        { blockNumber: 936242, difficulty: "145000000000000" },
        { blockNumber: 936386, difficulty: "138000000000000" },
        { blockNumber: 936386, difficulty: "145150000000000" },
    ];

    // Store results for summary
    const results = [];

    for (let i = 0; i < batchConfigs.length; i++) {
        const { blockNumber, difficulty } = batchConfigs[i];
        const QUESTION_CONFIG = {
            type: QuestionType.DifficultyThreshold,
            difficultyThreshold: ethers.BigNumber.from(difficulty),
            targetBlockHeight: blockNumber,
            outcomeSlotCount: 2,
            metadataURI: `https://doefin.com/questions/btc-difficulty-threshold/${blockNumber}-${difficulty}`,
            salt: ethers.utils.randomBytes(32)
        };

        console.log(`\n============================\n▶️ Creating Condition #${i+1}`);
        console.log("   Block Number:", blockNumber);
        console.log("   Difficulty:", difficulty);
        console.log("   Metadata URI:", QUESTION_CONFIG.metadataURI);

        // Encode metadata
        let metadata = encodeDifficultyThreshold(
            QUESTION_CONFIG.difficultyThreshold,
            QUESTION_CONFIG.targetBlockHeight
        );

        try {
            const createTx = await diamond.createConditionWithMetadata(
                QUESTION_CONFIG.type,
                metadata,
                QUESTION_CONFIG.outcomeSlotCount,
                QUESTION_CONFIG.metadataURI,
                QUESTION_CONFIG.salt,
                { gasLimit: 1000000 }
            );
            console.log("📤 Transaction sent:", createTx.hash);
            const receipt = await createTx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

            // Parse ConditionCreated event
            let conditionId = null;
            let questionId = null;
            const conditionCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsed = diamond.interface.parseLog(log);
                    return parsed.name === "ConditionCreated";
                } catch {
                    return false;
                }
            });
            if (conditionCreatedEvent) {
                const parsed = diamond.interface.parseLog(conditionCreatedEvent);
                conditionId = parsed.args.conditionId;
                questionId = parsed.args.questionId;
                console.log("🎉 ConditionCreated event emitted:");
                console.log("   Condition ID:", conditionId);
                console.log("   Question ID:", questionId);
            }
            // Verify the condition was created
            if (conditionId) {
                const conditionInfo = await diamond.getCondition(conditionId);
                console.log("   Oracle:", conditionInfo.oracle);
                console.log("   Active:", conditionInfo.active);
                console.log("   Creator:", conditionInfo.creator);
                console.log("   Metadata URI:", conditionInfo.metadataURI);
            }
            results.push({
                index: i+1,
                blockNumber,
                difficulty,
                conditionId,
                questionId
            });
        } catch (error) {
            console.error(`❌ Condition #${i+1} creation failed:`, error);
            if (error.message && error.message.includes("InvalidOutcomeSlotCount")) {
                console.error("💡 Hint: outcomeSlotCount must be > 1");
            } else if (error.message && error.message.includes("InvalidTargetBlockHeight")) {
                console.error("💡 Hint: Target block height must be greater than current block height");
            } else if (error.message && error.message.includes("NotAuthorized")) {
                console.error("💡 Hint: Make sure the account is added as a market maker");
            }
            results.push({
                index: i+1,
                blockNumber,
                difficulty,
                error: error.message
            });
        }
    }

    // Print summary
    console.log("\n============================\nBatch Creation Summary:");
    for (const r of results) {
        if (r.conditionId) {
            console.log(`#${r.index}: Block ${r.blockNumber}, Difficulty ${r.difficulty}`);
            console.log(`   Condition ID: ${r.conditionId}`);
            console.log(`   Question ID: ${r.questionId}`);
        } else {
            console.log(`#${r.index}: Block ${r.blockNumber}, Difficulty ${r.difficulty}`);
            console.log(`   ❌ Error: ${r.error}`);
        }
    }
}

// Helper function to display usage instructions
function displayUsage() {
    console.log("\n📖 Usage Instructions:");
    console.log("This script creates different types of oracle questions using createConditionWithMetadata()");
    console.log("\nSupported Question Types:");
    console.log("  • DifficultyThreshold - Binary: Will difficulty exceed threshold at target block?");
    console.log("  • DifficultyRange - Multiple: Which difficulty range will the target block be in?");
    console.log("  • BlockCount - Multiple: How many blocks will be mined in time period?");
    console.log("  • MiningDuration - Multiple: How long will it take to mine N blocks?");
    console.log("\nTo change question type, modify QUESTION_CONFIG.type in the script");
    console.log("Example: type: QuestionType.DifficultyRange");
}

main()
    .then(() => {
        displayUsage();
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error:", error.message);
        displayUsage();
        process.exit(1);
    });