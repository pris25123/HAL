Team SkyLens- EO/IR Sensor Video Image Classification & Identification System – HAL Aerothon '25

This project implements an object detection pipeline using **YOLOv8** and **VisDrone** to process aerial EO (Electro-Optical) and IR (Infrared) videos. A custom dataset with **35+ object classes** was created, and the system estimates **drone-to-object height and distance** for accurate post-mission surveillance analysis.

## Features

- Trained YOLOv8 and VisDrone model on custom EO/IR dataset
- 35+ custom classes including vehicles, people, terrains, and structures
- Distance and height estimation from drone to target
- Support for both RGB and thermal video input
- Post-mission analysis output for review

 ## Getting Started
1) Run yolov8_VisDrone.ipynb
This notebook sets up the YOLOv8 framework and trains it using the VisDrone dataset, which contains aerial drone footage—making it significantly more accurate for top-down object detection compared to standard COCO-based models.

2) Download the datasets/ folder
This folder includes over 500 finely annotated images across 35+ categories, curated specifically for aerial object detection tasks (people, vehicles, terrains, and incidences).

3) Load the best trained model best (4) (1).pt
Use this model for inference. It contains the highest-performing weights trained on our dataset.

4) Launch the frontend/ folder
This runs the user-facing interface for uploading drone images or video frames and visualizing detections with bounding boxes and class labels.


