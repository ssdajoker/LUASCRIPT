#include <stdio.h>

struct Pair
{
    double left;
    double right;
};

struct Pair make_pair(double left, double right)
{
    struct Pair pair = {left, right};
    return pair;
}

int main(void)
{
    struct Pair pair = make_pair(5, 7);
    printf("c_struct_return %g %g\n", pair.left, pair.right);
}
