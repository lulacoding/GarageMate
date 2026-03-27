"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expireListings_1 = require("../expireListings");
const mockBatch = {
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
};
const mockDb = {
    batch: jest.fn(() => mockBatch),
    collection: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
};
describe('expireListings', () => {
    beforeEach(() => jest.clearAllMocks());
    it('calls batch.update for each expired listing', async () => {
        mockDb.get.mockResolvedValue({
            docs: [{ ref: 'ref1' }, { ref: 'ref2' }],
            empty: false,
        });
        await (0, expireListings_1.expireListings)(mockDb, new Date());
        expect(mockBatch.update).toHaveBeenCalledTimes(2);
        expect(mockBatch.update).toHaveBeenCalledWith('ref1', { active: false });
        expect(mockBatch.update).toHaveBeenCalledWith('ref2', { active: false });
        expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
    it('does nothing when no listings are expired', async () => {
        mockDb.get.mockResolvedValue({ docs: [], empty: true });
        await (0, expireListings_1.expireListings)(mockDb, new Date());
        expect(mockBatch.update).not.toHaveBeenCalled();
        expect(mockBatch.commit).not.toHaveBeenCalled();
    });
    it('chunks batches at 499 documents', async () => {
        const docs = Array.from({ length: 600 }, (_, i) => ({ ref: `ref${i}` }));
        mockDb.get.mockResolvedValue({ docs, empty: false });
        await (0, expireListings_1.expireListings)(mockDb, new Date());
        // 499 + 101 = 2 commits
        expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=expireListings.test.js.map