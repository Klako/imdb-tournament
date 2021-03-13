#!/bin/bash

while ! mongo ping -h"${MONGO_HOST}" --silent; do
    sleep 1
done