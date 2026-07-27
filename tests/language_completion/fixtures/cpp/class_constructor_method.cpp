#include <iostream>

class Counter
{
public:
    double value;
    double step;

    Counter(double start, double increment)
    {
        this->value = start;
        this->step = increment;
    }

    double total()
    {
        return this->value + this->step;
    }
};

int main()
{
    Counter counter = Counter(5, 3);
    counter.value += 2;
    std::cout << "cpp_ctor_method " << counter.value << " " << counter.total() << std::endl;
}
