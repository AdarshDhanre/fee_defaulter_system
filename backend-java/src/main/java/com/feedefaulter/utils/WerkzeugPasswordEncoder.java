package com.feedefaulter.utils;

import org.bouncycastle.crypto.generators.SCrypt;
import org.bouncycastle.util.encoders.Hex;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;

public class WerkzeugPasswordEncoder {

    public static boolean checkPassword(String password, String werkzeugHash) {
        if (werkzeugHash == null || password == null) {
            return false;
        }

        try {
            // Case 1: scrypt format (scrypt:N:r:p$salt$hash)
            if (werkzeugHash.startsWith("scrypt:")) {
                String[] parts = werkzeugHash.split("\\$");
                if (parts.length < 3) {
                    return false;
                }

                String[] params = parts[0].split(":");
                if (params.length < 4) {
                    return false;
                }

                int N = Integer.parseInt(params[1]);
                int r = Integer.parseInt(params[2]);
                int p = Integer.parseInt(params[3]);

                String saltStr = parts[1];
                String hashHex = parts[2];

                byte[] saltBytes = saltStr.getBytes(StandardCharsets.UTF_8);
                byte[] passwordBytes = password.getBytes(StandardCharsets.UTF_8);

                // Werkzeug scrypt uses dkLen = 64
                byte[] generatedHashBytes = SCrypt.generate(passwordBytes, saltBytes, N, r, p, 64);
                String generatedHashHex = Hex.toHexString(generatedHashBytes);

                return generatedHashHex.equalsIgnoreCase(hashHex);
            }

            // Case 2: pbkdf2 format (pbkdf2:algorithm:iterations$salt$hash)
            if (werkzeugHash.startsWith("pbkdf2:")) {
                String[] parts = werkzeugHash.split("\\$");
                if (parts.length < 3) {
                    return false;
                }

                String[] params = parts[0].split(":");
                if (params.length < 3) {
                    return false;
                }

                String algorithm = params[1]; // sha256, sha1, etc.
                int iterations = Integer.parseInt(params[2]);

                String saltStr = parts[1];
                String hashHex = parts[2];

                byte[] saltBytes = saltStr.getBytes(StandardCharsets.UTF_8);
                
                String keyFactoryAlg;
                int keyLength;
                if ("sha256".equalsIgnoreCase(algorithm)) {
                    keyFactoryAlg = "PBKDF2WithHmacSHA256";
                    keyLength = 256; // 32 bytes
                } else if ("sha1".equalsIgnoreCase(algorithm)) {
                    keyFactoryAlg = "PBKDF2WithHmacSHA1";
                    keyLength = 160; // 20 bytes
                } else {
                    System.err.println("[WARN] Unsupported Werkzeug pbkdf2 algorithm: " + algorithm);
                    return false;
                }

                PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), saltBytes, iterations, keyLength);
                SecretKeyFactory skf = SecretKeyFactory.getInstance(keyFactoryAlg);
                byte[] generatedHashBytes = skf.generateSecret(spec).getEncoded();
                String generatedHashHex = Hex.toHexString(generatedHashBytes);

                return generatedHashHex.equalsIgnoreCase(hashHex);
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to check Werkzeug password hash: " + e.getMessage());
            e.printStackTrace();
        }

        return false;
    }
}
