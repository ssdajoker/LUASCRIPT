#include <stdlib.h>

int main(void)
{
    int *values = malloc(sizeof(int) * 3);
    free(values);
}
