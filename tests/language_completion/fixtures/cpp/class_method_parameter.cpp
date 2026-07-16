#include <iostream>

class Scale
{
public:
    double base;
    double factor;

    Scale(double baseValue, double factorValue)
    {
        this->base = baseValue;
        this->factor = factorValue;
    }

    double apply(double offset)
    {
        return this->base * this->factor + offset;
    }
};

double run(Scale scale)
{
    return scale.apply(4);
}

int main()
{
    Scale scale = Scale(3, 5);
    std::cout << "cpp_method_param " << run(scale) << std::endl;
}
