#include <iostream>

class Counter
{
public:
    double value;
    double step;
};

double advance(Counter counter)
{
    return counter.value + counter.step;
}

int main()
{
    Counter counter = {5, 3};
    counter.value += 2;
    std::cout << "cpp_class " << counter.value << " " << advance(counter) << std::endl;
}
