const roundRobinSchema = new mongoose.Schema({
    currentIndex: {
        type: Number,
        default: 0
    }
});

export const RoundRobin = mongoose.model("RoundRobin", roundRobinSchema);