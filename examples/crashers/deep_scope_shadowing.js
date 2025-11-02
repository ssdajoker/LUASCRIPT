function deepShadow(level) {
    let label = "outer";
    function descend(depth) {
        let label = "shadow-" + depth;
        if (depth === 0) {
            return label;
        }
        return descend(depth - 1);
    }
    const inner = descend(level);
    return label + ":" + inner;
}

deepShadow(6);
