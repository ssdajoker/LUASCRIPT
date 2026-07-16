#include <string.h>
#include <stdio.h>

int main(void)
{
    const char *word = "maze";
    const char *label = "bad";
    if (word[1] == 'a')
    {
        label = "ok";
    }
    int count = strlen(word);
    printf("c_string %s %d\n", label, count);
}
