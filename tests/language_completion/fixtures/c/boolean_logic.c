#include <stdbool.h>
#include <stdio.h>

int main(void)
{
    int total = 8;
    bool ready = true;
    const char *label = "blocked";
    if (ready && total == 8)
    {
        label = "ready";
    }
    printf("c_bool %s\n", label);
}
