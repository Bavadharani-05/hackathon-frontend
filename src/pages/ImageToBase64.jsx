import { useEffect } from "react";
import testImage from "../images/normal.png"; // adjust path if needed

const ImageToBase64 = () => {
  useEffect(() => {
    const convertAndSend = async () => {
      try {
        // Fetch the local image as a blob
        const response = await fetch(testImage);
        const blob = await response.blob();

        // Convert blob to Base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result.split(",")[1]; // remove data:image/... prefix

          console.log("Base64:", base64String);

          // Call POST API
          const apiResponse = await fetch("https://bavadharani05-image-analyzer-2.hf.space/predict", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_base64: base64String,

            }),
          });

          const data = await apiResponse.json();
          console.log("API response:", data);
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error converting or sending image:", error);
      }
    };

    convertAndSend();
  }, []);

  return <div>Image is being processed...</div>;
};

export default ImageToBase64;