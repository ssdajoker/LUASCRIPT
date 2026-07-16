#include <stdio.h>

struct Point
{
    double x;
    double y;
};

double energy(struct Point point)
{
    return point.x * point.x + point.y * point.y;
}

int main(void)
{
    struct Point point = {3, 4};
    point.x = point.x + 1;
    printf("c_struct %g %g\n", point.x, energy(point));
}
