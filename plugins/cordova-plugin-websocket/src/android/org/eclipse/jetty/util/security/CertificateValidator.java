//
//  ========================================================================
//  Copyright (c) 1995-2015 Mort Bay Consulting Pty. Ltd.
//  ------------------------------------------------------------------------
//  All rights reserved. This program and the accompanying materials
//  are made available under the terms of the Eclipse Public License v1.0
//  and Apache License v2.0 which accompanies this distribution.
//
//      The Eclipse Public License is available at
//      http://www.eclipse.org/legal/epl-v10.html
//
//      The Apache License v2.0 is available at
//      http://www.opensource.org/licenses/apache2.0.php
//
//  You may elect to redistribute this code under either of these licenses.
//  ========================================================================
//

package org.eclipse.jetty.util.security;

import java.security.GeneralSecurityException;
import java.security.InvalidParameterException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.Security;
import java.security.cert.CRL;
import java.security.cert.CertPathBuilder;
import java.security.cert.CertPathBuilderResult;
import java.security.cert.CertPathValidator;
import java.security.cert.CertStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CollectionCertStoreParameters;
import java.security.cert.PKIXBuilderParameters;
import java.security.cert.X509CertSelector;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicLong;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;

/**
 * Convenience class to handle validation of certificates, aliases and keystores
 *
 * Allows specifying Certificate Revocation List (CRL), as well as enabling
 * CRL Distribution Points Protocol (CRLDP) certificate extension support,
 * and also enabling On-Line Certificate Status Protocol (OCSP) support.
 *
 * IMPORTANT: at least one of the above mechanisms *MUST* be configured and
 * operational, otherwise certificate validation *WILL FAIL* unconditionally.
 */
public class CertificateValidator
{
    private static final Logger LOG = Log.getLogger(CertificateValidator.class);
    private static AtomicLong __aliasCount = new AtomicLong();

    private KeyStore _trustStore;
    private Collection<? extends CRL> _crls;

    /** Maximum certification path length (n - number of intermediate certs, -1 for unlimited) */
    private int _maxCertPathLength = -1;
    /** CRL Distribution Points (CRLDP) support */
    private boolean _enableCRLDP = false;
    /** On-Line Certificate Status Protocol (OCSP) support */
    private boolean _enableOCSP = false;

    /**
     * creates an instance of the certificate validator
     *
     * @param trustStore
     * @param crls
     */
    public CertificateValidator(KeyStore trustStore, Collection<? extends CRL> crls)
    {
        if (trustStore == null)
        {
            throw new InvalidParameterException("TrustStore must be specified for CertificateValidator.");
        }

        _trustStore = trustStore;
        _crls = crls;
    }

    /**
     * validates a specific certificate inside of the keystore being passed in
     *
     * @param keyStore
     * @param cert
     * @throws CertificateException
     */
    public void validate(KeyStore keyStore, Certificate cert) throws CertificateException
    {
        Certificate[] certChain = null;

        if (cert != null && cert instanceof X509Certificate)
        {
            ((X509Certificate)cert).checkValidity();

            String certAlias = null;
            try
            {
                if (keyStore == null)
                {
                    throw new InvalidParameterException("Keystore cannot be null");
                }

                certAlias = keyStore.getCertificateAlias((X509Certificate)cert);
                if (certAlias == null)
                {
                    certAlias = "JETTY" + String.format("%016X",__aliasCount.incrementAndGet());
                    keyStore.setCertificateEntry(certAlias, cert);
                }

                certChain = keyStore.getCertificateChain(certAlias);
                if (certChain == null || certChain.length == 0)
                {
                    throw new IllegalStateException("Unable to retrieve certificate chain");
                }
            }
            catch (KeyStoreException kse)
            {
                LOG.debug(kse);
                throw new CertificateException("Unable to validate certificate" +
                        (certAlias == null ? "":" for alias [" +certAlias + "]") + ": " + kse.getMessage(), kse);
            }

            validate(certChain);
        }
    }

    public void validate(Certificate[] certChain) throws CertificateException
    {
        try
        {
            ArrayList<X509Certificate> certList = new ArrayList<X509Certificate>();
            for (Certificate item : certChain)
            {
                if (item == null)
                    continue;

                if (!(item instanceof X509Certificate))
                {
                    throw new IllegalStateException("Invalid certificate type in chain");
                }

                certList.add((X509Certificate)item);
            }

            if (certList.isEmpty())
            {
                throw new IllegalStateException("Invalid certificate chain");

            }

            X509CertSelector certSelect = new X509CertSelector();
            certSelect.setCertificate(certList.get(0));

            // Configure certification path builder parameters
            PKIXBuilderParameters pbParams = new PKIXBuilderParameters(_trustStore, certSelect);
            pbParams.addCertStore(CertStore.getInstance("Collection", new CollectionCertStoreParameters(certList)));

            // Set maximum certification path length
            pbParams.setMaxPathLength(_maxCertPathLength);

            // Enable revocation checking
            pbParams.setRevocationEnabled(true);

            // Set static Certificate Revocation List
            if (_crls != null && !_crls.isEmpty())
            {
                pbParams.addCertStore(CertStore.getInstance("Collection", new CollectionCertStoreParameters(_crls)));
            }

            // Enable On-Line Certificate Status Protocol (OCSP) support
            if (_enableOCSP)
            {
                Security.setProperty("ocsp.enable","true");
            }
            // Enable Certificate Revocation List Distribution Points (CRLDP) support
            if (_enableCRLDP)
            {
                System.setProperty("com.sun.security.enableCRLDP","true");
            }

            // Build certification path
            CertPathBuilderResult buildResult = CertPathBuilder.getInstance("PKIX").build(pbParams);

            // Validate certification path
            CertPathValidator.getInstance("PKIX").validate(buildResult.getCertPath(),pbParams);
        }
        catch (GeneralSecurityException gse)
        {
            LOG.debug(gse);
            throw new CertificateException("Unable to validate certificate: " + gse.getMessage(), gse);
        }
    }

    /* ------------------------------------------------------------ */
    /**
     * @param maxCertPathLength
     *            maximum number of intermediate certificates in
     *            the certification path (-1 for unlimited)
     */
    public void setMaxCertPathLength(int maxCertPathLength)
    {
        _maxCertPathLength = maxCertPathLength;
    }

    /* ------------------------------------------------------------ */
    /** Enables CRL Distribution Points Support
     * @param enableCRLDP true - turn on, false - turns off
     */
    public void setEnableCRLDP(boolean enableCRLDP)
    {
        _enableCRLDP = enableCRLDP;
    }

    /* ------------------------------------------------------------ */
    /** Enables On-Line Certificate Status Protocol support
     * @param enableOCSP true - turn on, false - turn off
     */
    public void setEnableOCSP(boolean enableOCSP)
    {
        _enableOCSP = enableOCSP;
    }
}
