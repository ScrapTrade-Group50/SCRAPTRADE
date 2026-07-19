package com.scraptrade.scraptrade_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Service
public class FileUploadService {

    private final Optional<Cloudinary> cloudinary;

    public FileUploadService(@Autowired(required = false) Cloudinary cloudinary) {
        this.cloudinary = Optional.ofNullable(cloudinary);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No image file was received.");
        }

        Cloudinary client = cloudinary.orElseThrow(() -> new IllegalStateException(
                "Image upload is not configured. Add cloudinary.cloud-name, cloudinary.api-key, "
                        + "and cloudinary.api-secret to application-local.properties. "
                        + "Listings can still be created without a photo."));

        try {
            Map uploadResult = client.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return uploadResult.get("secure_url").toString();
        } catch (Exception ex) {
            String detail = ex.getMessage() != null ? ex.getMessage() : ex.toString();
            if (detail.contains("Invalid Signature") || detail.contains("Invalid API Key")) {
                throw new IllegalArgumentException(
                        "Cloudinary credentials are invalid. Re-copy cloud name, API key, and API secret "
                                + "from your Cloudinary dashboard into application-local.properties, then restart the backend.");
            }
            throw new IOException("Cloudinary upload failed: " + detail, ex);
        }
    }

    public boolean isConfigured() {
        return cloudinary.isPresent();
    }
}
