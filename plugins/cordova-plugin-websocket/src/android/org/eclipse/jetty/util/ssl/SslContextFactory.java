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

package org.eclipse.jetty.util.ssl;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.CRL;
import java.security.cert.CertStore;
import java.security.cert.Certificate;
import java.security.cert.CollectionCertStoreParameters;
import java.security.cert.PKIXBuilderParameters;
import java.security.cert.X509CertSelector;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import javax.net.ssl.CertPathTrustManagerParameters;
import javax.net.ssl.KeyManager;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509KeyManager;
import javax.net.ssl.X509TrustManager;

import org.eclipse.jetty.util.IO;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;
import org.eclipse.jetty.util.security.CertificateUtils;
import org.eclipse.jetty.util.security.CertificateValidator;
import org.eclipse.jetty.util.security.Password;

import android.annotation.SuppressLint;
import android.os.Build;


/* ------------------------------------------------------------ */
/**
 * SslContextFactory is used to configure SSL connectors
 * as well as HttpClient. It holds all SSL parameters and
 * creates SSL context based on these parameters to be
 * used by the SSL connectors.
 *
 * modified by KNOWLEDGECODE
 */
public class SslContextFactory extends AbstractLifeCycle
{
    public final static TrustManager[] TRUST_ALL_CERTS = new X509TrustManager[]{new X509TrustManager()
    {
        public java.security.cert.X509Certificate[] getAcceptedIssuers()
        {
            return new java.security.cert.X509Certificate[]{};
        }

        public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType)
        {
        }

        public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType)
        {
            /**
             * workaround for SSL bugs in 4.0.3 and lower
             * @see https://github.com/koush/AndroidAsync/blob/master/AndroidAsync/src/com/koushikdutta/async/AsyncSSLSocketWrapper.java
             */
            if (Build.VERSION.SDK_INT <= 15)
            {
                for (java.security.cert.X509Certificate cert : certs)
                {
                    if (cert != null && cert.getCriticalExtensionOIDs() != null)
                    {
                        cert.getCriticalExtensionOIDs().remove("2.5.29.15");
                    }
                }
            }
        }
    }};

    private static final Logger LOG = Log.getLogger(SslContextFactory.class);

    public static final String DEFAULT_KEYMANAGERFACTORY_ALGORITHM =
        (Security.getProperty("ssl.KeyManagerFactory.algorithm") == null ?
                "SunX509" : Security.getProperty("ssl.KeyManagerFactory.algorithm"));
    public static final String DEFAULT_TRUSTMANAGERFACTORY_ALGORITHM =
        (Security.getProperty("ssl.TrustManagerFactory.algorithm") == null ?
                "SunX509" : Security.getProperty("ssl.TrustManagerFactory.algorithm"));

    /** Default value for the keystore location path. */
    public static final String DEFAULT_KEYSTORE_PATH =
        System.getProperty("user.home") + File.separator + ".keystore";

    /** String name of key password property. */
    public static final String KEYPASSWORD_PROPERTY = "org.eclipse.jetty.ssl.keypassword";

    /** String name of keystore password property. */
    public static final String PASSWORD_PROPERTY = "org.eclipse.jetty.ssl.password";

    /** Excluded protocols. */
    private final Set<String> _excludeProtocols = new LinkedHashSet<String>();
    /** Included protocols. */
    private Set<String> _includeProtocols = new LinkedHashSet<String>();

    /** Excluded cipher suites. */
    private final Set<String> _excludeCipherSuites = new LinkedHashSet<String>();
    /** Included cipher suites. */
    private Set<String> _includeCipherSuites = new LinkedHashSet<String>();

    /** Keystore path. */
    private String _keyStorePath;
    /** Keystore provider name */
    private String _keyStoreProvider;
    /** Keystore type */
    private String _keyStoreType = "JKS";
    /** Keystore input stream */
    private InputStream _keyStoreInputStream;

    /** SSL certificate alias */
    private String _certAlias;

    /** Truststore path */
    private String _trustStorePath;
    /** Truststore provider name */
    private String _trustStoreProvider;
    /** Truststore type */
    private String _trustStoreType = "JKS";
    /** Truststore input stream */
    private InputStream _trustStoreInputStream;

    /** Set to true if client certificate authentication is required */
    private boolean _needClientAuth = false;
    /** Set to true if client certificate authentication is desired */
    private boolean _wantClientAuth = false;

    /** Keystore password */
    private transient Password _keyStorePassword;
    /** Key manager password */
    private transient Password _keyManagerPassword;
    /** Truststore password */
    private transient Password _trustStorePassword;

    /** SSL provider name */
    private String _sslProvider;
    /** SSL protocol name */
    private String _sslProtocol = "TLS";

    /** SecureRandom algorithm */
    private String _secureRandomAlgorithm;
    /** KeyManager factory algorithm */
    private String _keyManagerFactoryAlgorithm = DEFAULT_KEYMANAGERFACTORY_ALGORITHM;
    /** TrustManager factory algorithm */
    private String _trustManagerFactoryAlgorithm = DEFAULT_TRUSTMANAGERFACTORY_ALGORITHM;

    /** Set to true if SSL certificate validation is required */
    private boolean _validateCerts;
    /** Set to true if SSL certificate of the peer validation is required */
    private boolean _validatePeerCerts;
    /** Maximum certification path length (n - number of intermediate certs, -1 for unlimited) */
    private int _maxCertPathLength = -1;
    /** Path to file that contains Certificate Revocation List */
    private String _crlPath;
    /** Set to true to enable CRL Distribution Points (CRLDP) support */
    private boolean _enableCRLDP = false;
    /** Set to true to enable On-Line Certificate Status Protocol (OCSP) support */
    private boolean _enableOCSP = false;
    /** Location of OCSP Responder */
    private String _ocspResponderURL;

    /** SSL keystore */
    private KeyStore _keyStore;
    /** SSL truststore */
    private KeyStore _trustStore;
    /** Set to true to enable SSL Session caching */
    private boolean _sessionCachingEnabled = true;

    /** SSL context */
    private SSLContext _context;

    private boolean _trustAll;

    /* ------------------------------------------------------------ */
    /**
     * Construct an instance of SslContextFactory
     * Default constructor for use in XmlConfiguration files
     */
    public SslContextFactory()
    {
        _trustAll=true;
    }

    /* ------------------------------------------------------------ */
    /**
     * Create the SSLContext object and start the lifecycle
     * @see org.eclipse.jetty.util.component.AbstractLifeCycle#doStart()
     */
    @SuppressLint("TrulyRandom")
    @Override
    protected void doStart() throws Exception
    {
        if (_context == null)
        {
            if (_keyStore==null && _keyStoreInputStream == null && _keyStorePath == null &&
                _trustStore==null && _trustStoreInputStream == null && _trustStorePath == null )
            {
                TrustManager[] trust_managers=null;

                if (_trustAll)
                {
                    LOG.debug("No keystore or trust store configured.  ACCEPTING UNTRUSTED CERTIFICATES!!!!!");
                    // Create a trust manager that does not validate certificate chains
                    trust_managers = TRUST_ALL_CERTS;
                }

                SecureRandom secureRandom = (_secureRandomAlgorithm == null)?null:SecureRandom.getInstance(_secureRandomAlgorithm);
                _context = (_sslProvider == null)?SSLContext.getInstance(_sslProtocol):SSLContext.getInstance(_sslProtocol,_sslProvider);
                _context.init(null, trust_managers, secureRandom);
            }
            else
            {
                // verify that keystore and truststore
                // parameters are set up correctly
                checkKeyStore();

                KeyStore keyStore = loadKeyStore();
                KeyStore trustStore = loadTrustStore();

                Collection<? extends CRL> crls = loadCRL(_crlPath);

                if (_validateCerts && keyStore != null)
                {
                    if (_certAlias == null)
                    {
                        List<String> aliases = Collections.list(keyStore.aliases());
                        _certAlias = aliases.size() == 1 ? aliases.get(0) : null;
                    }

                    Certificate cert = _certAlias == null?null:keyStore.getCertificate(_certAlias);
                    if (cert == null)
                    {
                        throw new Exception("No certificate found in the keystore" + (_certAlias==null ? "":" for alias " + _certAlias));
                    }

                    CertificateValidator validator = new CertificateValidator(trustStore, crls);
                    validator.setMaxCertPathLength(_maxCertPathLength);
                    validator.setEnableCRLDP(_enableCRLDP);
                    validator.setEnableOCSP(_enableOCSP);
                    validator.validate(keyStore, cert);
                }

                KeyManager[] keyManagers = getKeyManagers(keyStore);
                TrustManager[] trustManagers = getTrustManagers(trustStore,crls);

                SecureRandom secureRandom = (_secureRandomAlgorithm == null)?null:SecureRandom.getInstance(_secureRandomAlgorithm);
                _context = (_sslProvider == null)?SSLContext.getInstance(_sslProtocol):SSLContext.getInstance(_sslProtocol,_sslProvider);
                _context.init(keyManagers,trustManagers,secureRandom);

                SSLEngine engine=newSslEngine();

                LOG.info("Enabled Protocols {} of {}",Arrays.asList(engine.getEnabledProtocols()),Arrays.asList(engine.getSupportedProtocols()));
                if (LOG.isDebugEnabled())
                    LOG.debug("Enabled Ciphers   {} of {}",Arrays.asList(engine.getEnabledCipherSuites()),Arrays.asList(engine.getSupportedCipherSuites()));
            }
        }
    }

    /* ------------------------------------------------------------ */
    /**
     * @return True if SSL needs client authentication.
     * @see SSLEngine#getNeedClientAuth()
     */
    public boolean getNeedClientAuth()
    {
        return _needClientAuth;
    }

    /* ------------------------------------------------------------ */
    /**
     * @return True if SSL wants client authentication.
     * @see SSLEngine#getWantClientAuth()
     */
    public boolean getWantClientAuth()
    {
        return _wantClientAuth;
    }

    /* ------------------------------------------------------------ */
    /**
     * Override this method to provide alternate way to load a keystore.
     *
     * @return the key store instance
     * @throws Exception if the keystore cannot be loaded
     */
    protected KeyStore loadKeyStore() throws Exception
    {
        return _keyStore != null ? _keyStore : getKeyStore(_keyStoreInputStream,
                _keyStorePath, _keyStoreType, _keyStoreProvider,
                _keyStorePassword==null? null: _keyStorePassword.toString());
    }

    /* ------------------------------------------------------------ */
    /**
     * Override this method to provide alternate way to load a truststore.
     *
     * @return the key store instance
     * @throws Exception if the truststore cannot be loaded
     */
    protected KeyStore loadTrustStore() throws Exception
    {
        return _trustStore != null ? _trustStore : getKeyStore(_trustStoreInputStream,
                _trustStorePath, _trustStoreType,  _trustStoreProvider,
                _trustStorePassword==null? null: _trustStorePassword.toString());
    }

    /* ------------------------------------------------------------ */
    /**
     * Loads keystore using an input stream or a file path in the same
     * order of precedence.
     *
     * Required for integrations to be able to override the mechanism
     * used to load a keystore in order to provide their own implementation.
     *
     * @param storeStream keystore input stream
     * @param storePath path of keystore file
     * @param storeType keystore type
     * @param storeProvider keystore provider
     * @param storePassword keystore password
     * @return created keystore
     * @throws Exception if the keystore cannot be obtained
     */
    protected KeyStore getKeyStore(InputStream storeStream, String storePath, String storeType, String storeProvider, String storePassword) throws Exception
    {
        return CertificateUtils.getKeyStore(storeStream, storePath, storeType, storeProvider, storePassword);
    }

    /* ------------------------------------------------------------ */
    /**
     * Loads certificate revocation list (CRL) from a file.
     *
     * Required for integrations to be able to override the mechanism used to
     * load CRL in order to provide their own implementation.
     *
     * @param crlPath path of certificate revocation list file
     * @return Collection of CRL's
     * @throws Exception if the certificate revocation list cannot be loaded
     */
    protected Collection<? extends CRL> loadCRL(String crlPath) throws Exception
    {
        return CertificateUtils.loadCRL(crlPath);
    }

    /* ------------------------------------------------------------ */
    protected KeyManager[] getKeyManagers(KeyStore keyStore) throws Exception
    {
        KeyManager[] managers = null;

        if (keyStore != null)
        {
            KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(_keyManagerFactoryAlgorithm);
            keyManagerFactory.init(keyStore,_keyManagerPassword == null?(_keyStorePassword == null?null:_keyStorePassword.toString().toCharArray()):_keyManagerPassword.toString().toCharArray());
            managers = keyManagerFactory.getKeyManagers();

            if (_certAlias != null)
            {
                for (int idx = 0; idx < managers.length; idx++)
                {
                    if (managers[idx] instanceof X509KeyManager)
                    {
                        managers[idx] = new AliasedX509ExtendedKeyManager(_certAlias,(X509KeyManager)managers[idx]);
                    }
                }
            }
        }

        return managers;
    }

    /* ------------------------------------------------------------ */
    protected TrustManager[] getTrustManagers(KeyStore trustStore, Collection<? extends CRL> crls) throws Exception
    {
        TrustManager[] managers = null;
        if (trustStore != null)
        {
            // Revocation checking is only supported for PKIX algorithm
            if (_validatePeerCerts && _trustManagerFactoryAlgorithm.equalsIgnoreCase("PKIX"))
            {
                PKIXBuilderParameters pbParams = new PKIXBuilderParameters(trustStore,new X509CertSelector());

                // Set maximum certification path length
                pbParams.setMaxPathLength(_maxCertPathLength);

                // Make sure revocation checking is enabled
                pbParams.setRevocationEnabled(true);

                if (crls != null && !crls.isEmpty())
                {
                    pbParams.addCertStore(CertStore.getInstance("Collection",new CollectionCertStoreParameters(crls)));
                }

                if (_enableCRLDP)
                {
                    // Enable Certificate Revocation List Distribution Points (CRLDP) support
                    System.setProperty("com.sun.security.enableCRLDP","true");
                }

                if (_enableOCSP)
                {
                    // Enable On-Line Certificate Status Protocol (OCSP) support
                    Security.setProperty("ocsp.enable","true");

                    if (_ocspResponderURL != null)
                    {
                        // Override location of OCSP Responder
                        Security.setProperty("ocsp.responderURL", _ocspResponderURL);
                    }
                }

                TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(_trustManagerFactoryAlgorithm);
                trustManagerFactory.init(new CertPathTrustManagerParameters(pbParams));

                managers = trustManagerFactory.getTrustManagers();
            }
            else
            {
                TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(_trustManagerFactoryAlgorithm);
                trustManagerFactory.init(trustStore);

                managers = trustManagerFactory.getTrustManagers();
            }
        }

        return managers;
    }

    /* ------------------------------------------------------------ */
    /**
     * Check KeyStore Configuration. Ensures that if keystore has been
     * configured but there's no truststore, that keystore is
     * used as truststore.
     * @throws IllegalStateException if SslContextFactory configuration can't be used.
     */
    public void checkKeyStore()
    {
        if (_context != null)
            return; //nothing to check if using preconfigured context


        if (_keyStore == null && _keyStoreInputStream == null && _keyStorePath == null)
            throw new IllegalStateException("SSL doesn't have a valid keystore");

        // if the keystore has been configured but there is no
        // truststore configured, use the keystore as the truststore
        if (_trustStore == null && _trustStoreInputStream == null && _trustStorePath == null)
        {
            _trustStore = _keyStore;
            _trustStorePath = _keyStorePath;
            _trustStoreInputStream = _keyStoreInputStream;
            _trustStoreType = _keyStoreType;
            _trustStoreProvider = _keyStoreProvider;
            _trustStorePassword = _keyStorePassword;
            _trustManagerFactoryAlgorithm = _keyManagerFactoryAlgorithm;
        }

        // It's the same stream we cannot read it twice, so read it once in memory
        if (_keyStoreInputStream != null && _keyStoreInputStream == _trustStoreInputStream)
        {
            try
            {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                IO.copy(_keyStoreInputStream, baos);
                _keyStoreInputStream.close();

                _keyStoreInputStream = new ByteArrayInputStream(baos.toByteArray());
                _trustStoreInputStream = new ByteArrayInputStream(baos.toByteArray());
            }
            catch (Exception ex)
            {
                throw new IllegalStateException(ex);
            }
        }
    }

    /* ------------------------------------------------------------ */
    /**
     * Select protocols to be used by the connector
     * based on configured inclusion and exclusion lists
     * as well as enabled and supported protocols.
     * @param enabledProtocols Array of enabled protocols
     * @param supportedProtocols Array of supported protocols
     * @return Array of protocols to enable
     */
    public String[] selectProtocols(String[] enabledProtocols, String[] supportedProtocols)
    {
        Set<String> selected_protocols = new LinkedHashSet<String>();

        // Set the starting protocols - either from the included or enabled list
        if (!_includeProtocols.isEmpty())
        {
            // Use only the supported included protocols
            for (String protocol : _includeProtocols)
                if(Arrays.asList(supportedProtocols).contains(protocol))
                    selected_protocols.add(protocol);
        }
        else
            selected_protocols.addAll(Arrays.asList(enabledProtocols));


        // Remove any excluded protocols
        if (_excludeProtocols != null)
            selected_protocols.removeAll(_excludeProtocols);

        return selected_protocols.toArray(new String[selected_protocols.size()]);
    }

    /* ------------------------------------------------------------ */
    /**
     * Select cipher suites to be used by the connector
     * based on configured inclusion and exclusion lists
     * as well as enabled and supported cipher suite lists.
     * @param enabledCipherSuites Array of enabled cipher suites
     * @param supportedCipherSuites Array of supported cipher suites
     * @return Array of cipher suites to enable
     */
    public String[] selectCipherSuites(String[] enabledCipherSuites, String[] supportedCipherSuites)
    {
        Set<String> selected_ciphers = new LinkedHashSet<String>();

        // Set the starting ciphers - either from the included or enabled list
        if (!_includeCipherSuites.isEmpty())
        {
            // Use only the supported included ciphers
            for (String cipherSuite : _includeCipherSuites)
                if(Arrays.asList(supportedCipherSuites).contains(cipherSuite))
                    selected_ciphers.add(cipherSuite);
        }
        else
            selected_ciphers.addAll(Arrays.asList(enabledCipherSuites));


        // Remove any excluded ciphers
        if (_excludeCipherSuites != null)
            selected_ciphers.removeAll(_excludeCipherSuites);
        return selected_ciphers.toArray(new String[selected_ciphers.size()]);
    }

    /* ------------------------------------------------------------ */
    /**
    * @return true if SSL Session caching is enabled
    */
    public boolean isSessionCachingEnabled()
    {
        return _sessionCachingEnabled;
    }

    /* ------------------------------------------------------------ */
    public SSLEngine newSslEngine(String host,int port)
    {
        SSLEngine sslEngine=isSessionCachingEnabled()
            ?_context.createSSLEngine(host, port)
            :_context.createSSLEngine();

        customize(sslEngine);
        return sslEngine;
    }

    /* ------------------------------------------------------------ */
    public SSLEngine newSslEngine()
    {
        SSLEngine sslEngine=_context.createSSLEngine();
        customize(sslEngine);
        return sslEngine;
    }

    /* ------------------------------------------------------------ */
    public void customize(SSLEngine sslEngine)
    {
        if (getWantClientAuth())
            sslEngine.setWantClientAuth(getWantClientAuth());
        if (getNeedClientAuth())
            sslEngine.setNeedClientAuth(getNeedClientAuth());

        sslEngine.setEnabledCipherSuites(selectCipherSuites(
                sslEngine.getEnabledCipherSuites(),
                sslEngine.getSupportedCipherSuites()));

        sslEngine.setEnabledProtocols(selectProtocols(sslEngine.getEnabledProtocols(),sslEngine.getSupportedProtocols()));
    }

    /* ------------------------------------------------------------ */
    public String toString()
    {
        return String.format("%s@%x(%s,%s)",
                getClass().getSimpleName(),
                hashCode(),
                _keyStorePath,
                _trustStorePath);
    }
}
