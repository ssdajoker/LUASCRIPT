function chain(value) {
    if (value <= 0) {
        return 0;
    }
    return 1 + chain(value - 1);
}

chain(48);
