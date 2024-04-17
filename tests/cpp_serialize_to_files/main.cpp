#include "SerializeToFiles.h"
#include <filesystem>

void show_usage_and_exit(char **argv) {
    std::cerr << "usage: " << argv[0] << " output_directory" << std::endl;
    exit(1);
}

int main(int argc, char **argv) {
    if (argc != 2) {
        show_usage_and_exit(argv);
    }
    const std::string output_path = argv[1];

    if (!std::filesystem::exists(output_path)) {
        std::cerr << "Output directory does not exist: " << output_path << std::endl;
        show_usage_and_exit(argv);
    }

    return serialize_to_files(output_path) ? 0 : 1;
}
