cmake_minimum_required(VERSION 3.5)
project(fusionbridge VERSION 1.0.0)

set(EOSIO_WASM_OLD_BEHAVIOR "Off")

find_package(eosio.cdt)

add_contract(fusionbridge fusionbridge fusionbridge.cpp)

target_include_directories(fusionbridge
    PUBLIC 
    ${CMAKE_SOURCE_DIR}
)

target_ricardian_directory(fusionbridge ${CMAKE_CURRENT_SOURCE_DIR})