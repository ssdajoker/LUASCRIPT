function makeCycle() {
    const node = {};
    node.self = node;
    node.marker = "cycle";
    return node;
}

const result = makeCycle();
result.self === result;
