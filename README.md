Team SkyLens- EO/IR Sensor Video Image Classification & Identification System – HAL Aerothon '25

This project implements an object detection pipeline using **YOLOv8** and **VisDrone** to process aerial EO (Electro-Optical) and IR (Infrared) videos. A custom dataset with **35+ object classes** was created, and the system estimates **drone-to-object height and distance** for accurate post-mission surveillance analysis.

## Features

- Trained YOLOv8 and VisDrone model on custom EO/IR dataset
- 35+ custom classes including vehicles, people, terrains, and structures
- Distance and height estimation from drone to target
- Support for both RGB and thermal video input
- Post-mission analysis output for review

## Getting Started

### Clone the repository
```bash
git clone https://github.com/your-username/eo-ir-object-detection.git
cd eo-ir-object-detection
