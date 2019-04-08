
const Promise = require("bluebird");
const _ = require("lodash");
const Orbs = require(`${__dirname}/../orbs-client-sdk-javascript/dist/index.js`);

function verifyResponse(response) {
    if (response.requestStatus != "COMPLETED" && response.executionResult != "SUCCESS" && response.transactionStatus != "COMMITTED") {
        throw new Error(response);
    }
}

class Conversation {
    constructor({ endpoint, virtualChainId, contractName }, { publicKey, privateKey }) {
        this.config = { endpoint, virtualChainId, contractName };
        this.credentials = { publicKey, privateKey };

        this.client = new Orbs.Client(endpoint, virtualChainId, "TEST_NET");
    }

    async sendMessageToChannel(channel, message) {
        const [tx] = this.client.createTransaction(this.credentials.publicKey, this.credentials.privateKey, this.config.contractName, "sendMessageToChannel", [Orbs.argString(channel), Orbs.argString(message)]);

        const response = await this.client.sendTransaction(tx);
        verifyResponse(response);

        return response.outputArguments[0].value;
    }

    async getMessagesForChannel(channel, from, to) {
        const [tx] = this.client.createTransaction(this.credentials.publicKey, this.credentials.privateKey, this.config.contractName, "getMessagesForChannel", [Orbs.argString(channel), Orbs.argUint64(from), Orbs.argUint64(to)]);

        const response = await this.client.sendTransaction(tx);
        verifyResponse(response);

        return JSON.parse(Buffer.from(response.outputArguments[0].value).toString());
    }

    async scroll(channel, from, callback) {
        let firstItem = from;
        while (true) {
            try {
                const messages = await this.getMessagesForChannel(channel, firstItem, firstItem+50);
                if (!_.isEmpty(messages)) {
                    callback(messages);
                    firstItem = _.last(messages).ID + 1;
                }
            } catch (e) {
                console.log(e);
            }

            await Promise.delay(2000);
        }
    }
}

module.exports = {
    Conversation
};
