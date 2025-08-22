import cv2
import sys
import json

def detect_face(video_path):
    cap = cv2.VideoCapture(video_path)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    x_total, y_total, w_total, h_total, count = 0, 0, 0, 0, 0

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret or frame_count > 50:  # chỉ lấy ~50 frame đầu để nhanh
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 5)

        if len(faces) > 0:
            (x, y, w, h) = faces[0]  # lấy mặt đầu tiên
            x_total += x
            y_total += y
            w_total += w
            h_total += h
            count += 1
        frame_count += 1

    cap.release()

    if count > 0:
        return {
            "x": int(x_total / count),
            "y": int(y_total / count),
            "w": int(w_total / count),
            "h": int(h_total / count)
        }
    else:
        return None

if __name__ == "__main__":
    video_path = sys.argv[1]
    box = detect_face(video_path)
    print(json.dumps(box))
