import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { bundleMDX } from 'mdx-bundler'
import readingTime from 'reading-time'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypePresetMinify from 'rehype-preset-minify'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import remarkImgToJsx from './remark-img-to-jsx'
import remarkTocHeadings from './remark-toc-headings'
import remarkCodeTitles from './remark-code-title'
import getAllFilesRecursively from './utils/files'

const root = process.cwd()

export function getFiles(type, otherLocale = '') {
  const prefixPaths = path.join(root, 'data', type)
  const files =
    otherLocale === ''
      ? getAllFilesRecursively(prefixPaths).filter(
          (path) => (path.replace(/^.*[\\/]/, '').match(/\./g) || []).length === 1
        )
      : getAllFilesRecursively(prefixPaths).filter((path) => path.includes(`.${otherLocale}.md`))

  // Only want to return blog/path and ignore root, replace is needed to work on Windows
  return files.map((file) => file.slice(prefixPaths.length + 1).replace(/\\/g, '/'))
}

export function formatSlug(slug) {
  // return slug.replace(/\.(mdx|md)/, '')
  // take the main root of slug e.g. post-name in post-name.en.mdx
  return slug.split('.')[0]
}

export function dateSortDesc(a, b) {
  if (a > b) return -1
  if (a < b) return 1
  return 0
}

// otherLocale === locale if locale !== defaultLocale
export async function getFileBySlug(type, slug, otherLocale = '') {
  const [mdxPath, mdPath] =
    otherLocale === ''
      ? [path.join(root, 'data', type, `${slug}.mdx`), path.join(root, 'data', type, `${slug}.md`)]
      : [
          path.join(root, 'data', type, `${slug}.${otherLocale}.mdx`),
          path.join(root, 'data', type, `${slug}.${otherLocale}.md`),
        ]

  const source = fs.existsSync(mdxPath)
    ? fs.readFileSync(mdxPath, 'utf8')
    : fs.readFileSync(mdPath, 'utf8')

  // https://github.com/kentcdodds/mdx-bundler#nextjs-esbuild-enoent
  if (process.platform === 'win32') {
    process.env.ESBUILD_BINARY_PATH = path.join(
      process.cwd(),
      'node_modules',
      'esbuild',
      'esbuild.exe'
    )
  } else {
    process.env.ESBUILD_BINARY_PATH = path.join(
      process.cwd(),
      'node_modules',
      'esbuild',
      'bin',
      'esbuild'
    )
  }

  let toc = []

  const { frontmatter, code } = await bundleMDX({
    source,
    // mdx imports can be automatically source from the components directory
    cwd: path.join(process.cwd(), 'components'),
    xdmOptions(options) {
      // this is the recommended way to add custom remark/rehype plugins:
      // The syntax might look weird, but it protects you in case we add/remove
      // plugins in the future.
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        [remarkTocHeadings, { exportRef: toc }],
        remarkGfm,
        remarkCodeTitles,
        remarkMath,
        remarkImgToJsx,
      ]
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeAutolinkHeadings,
        rehypeKatex,
        [rehypePrismPlus, { ignoreMissing: true }],
        rehypePresetMinify,
      ]
      return options
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.js': 'jsx',
      }
      return options
    },
  })

  return {
    mdxSource: code,
    toc,
    frontMatter: {
      readingTime: readingTime(code),
      slug: slug || null,
      fileName: fs.existsSync(mdxPath) ? `${slug}.mdx` : `${slug}.md`,
      ...frontmatter,
      date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
    },
  }
}

// otherLocale === locale if locale !== defaultLocale
export async function getAllFilesFrontMatter(folder, otherLocale) {
  const prefixPaths = path.join(root, 'data', folder)

  const files =
    otherLocale === ''
      ? getAllFilesRecursively(prefixPaths).filter(
          (path) => (path.replace(/^.*[\\/]/, '').match(/\./g) || []).length === 1
        )
      : getAllFilesRecursively(prefixPaths).filter((path) => path.includes(`.${otherLocale}.md`))

  // Check if the file exist in the otherlocale. If not, fallback to defaultLangage

  const allFrontMatter = []

  files.forEach((file) => {
    // Replace is needed to work on Windows
    const fileName = file.slice(prefixPaths.length + 1).replace(/\\/g, '/')
    // Remove Unexpected File
    if (path.extname(fileName) !== '.md' && path.extname(fileName) !== '.mdx') {
      return
    }
    const source = fs.readFileSync(file, 'utf8')
    const { data: frontmatter } = matter(source)
    if (frontmatter.draft !== true) {
      allFrontMatter.push({
        ...frontmatter,
        slug: formatSlug(fileName),
        date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
      })
    }
  })

  return allFrontMatter.sort((a, b) => dateSortDesc(a.date, b.date))
}
