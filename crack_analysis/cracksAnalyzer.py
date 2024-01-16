import cv2
import numpy as np

# Set the number of input images
num_images = 1

# Replace this part with the path to your local image file
image_path = 'crack_analysis/temp.jpg'
image = cv2.imread(image_path)

# Convert the image to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Apply Gaussian Blur
# blurred = cv2.GaussianBlur(gray, (9, 9), 0)
blurred =cv2.blur(gray,(4,4))
# Calculate the median value0
median = np.median(blurred)

# Set thresholds
threshold1 = int(max(0, 0.7 * median))
threshold2 = int(min(255, 1.3 * median))

# Apply Canny edge detection
edges = cv2.Canny(blurred, threshold1, threshold2)
# cv2.imshow('zaqq', edges)
# cv2.waitKey(0)
# cv2.destroyAllWindows()
# Find contours
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Print the number of white pixels
n_white_pix = np.sum(edges == 255)
print('Number of white pixels:', n_white_pix)

# Optionally, display the contours
cv2.drawContours(image, contours, -1, (0, 255, 0), 2)
# cv2.imshow('Contours', image)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

final_image_path = 'crack_analysis/temp.jpg'
cv2.imwrite(final_image_path, image)
print(f'Processed image saved at: {final_image_path}')