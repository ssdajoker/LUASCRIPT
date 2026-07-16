#include <iostream>
#include <string>

int main()
{
    std::string word = "maze";
    std::string label = "bad";
    if (word[1] == 'a')
    {
        label = "ok";
    }
    std::cout << "cpp_string_index " << label << std::endl;
}
