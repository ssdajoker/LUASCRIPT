function stressGc(iterations) {
    let aggregate = 0;
    let i = 0;
    while (i < iterations) {
        let payload = "";
        let j = 0;
        while (j < 32) {
            payload = payload + "segment" + j;
            j = j + 1;
        }
        aggregate = aggregate + payload.length;
        i = i + 1;
    }
    return aggregate;
}

stressGc(24);
